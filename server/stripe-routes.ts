/**
 * Stripe Routes for LexAssist AI
 * 
 * Handles checkout sessions, webhooks, and subscription management
 */

import Stripe from 'stripe';
import { Router, Request, Response } from 'express';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS, formatPrice } from './stripe-products';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

export const stripeRouter = Router();

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  userName: string,
  planId: string,
  billingPeriod: 'monthly' | 'yearly',
  origin: string
): Promise<{ url: string }> {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) {
    throw new Error('Plano não encontrado');
  }

  if (plan.priceMonthly === 0) {
    throw new Error('Plano gratuito não requer pagamento');
  }

  const priceInCents = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const interval = billingPeriod === 'yearly' ? 'year' : 'month';

  // Create or retrieve Stripe product
  const productName = `LexAssist AI - ${plan.name}`;
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: productName,
            description: plan.description,
            metadata: {
              plan_id: planId,
            },
          },
          unit_amount: priceInCents,
          recurring: {
            interval: interval,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      plan_id: planId,
      billing_period: billingPeriod,
    },
    success_url: `${origin}/dashboard?subscription=success&plan=${planId}`,
    cancel_url: `${origin}/assinatura?subscription=cancelled`,
  });

  if (!session.url) {
    throw new Error('Falha ao criar sessão de checkout');
  }

  return { url: session.url };
}

/**
 * Create Stripe Customer Portal Session
 */
export async function createPortalSession(
  stripeCustomerId: string,
  origin: string
): Promise<{ url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/assinatura`,
  });

  return { url: session.url };
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as any;
    return {
      status: sub.status,
      currentPeriodEnd: new Date((sub.current_period_end || 0) * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      planId: sub.metadata?.plan_id || 'unknown',
    };
  } catch (error) {
    console.error('[Stripe] Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return true;
  } catch (error) {
    console.error('[Stripe] Error cancelling subscription:', error);
    return false;
  }
}

/**
 * Webhook handler for Stripe events
 */
export async function handleStripeWebhook(
  payload: Buffer,
  signature: string
): Promise<{ received: boolean; type?: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('[Stripe Webhook] Missing webhook secret');
    throw new Error('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return { 
      received: true,
      type: event.type
    };
  }

  const db = await getDb();
  if (!db) {
    console.error('[Stripe Webhook] Database not available');
    throw new Error('Database not available');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id || session.client_reference_id || '0');
      const planId = session.metadata?.plan_id || 'professional';
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId > 0) {
        console.log(`[Stripe Webhook] Checkout completed for user ${userId}, plan: ${planId}`);
        
        // Update user with Stripe IDs and subscription plan
        await db.update(users).set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionPlan: planId as 'free' | 'professional' | 'enterprise',
          subscriptionExpiresAt: null, // Will be set by subscription events
        }).where(eq(users.id, userId));
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;
      const planId = subscription.metadata?.plan_id || 'professional';
      const periodEnd = new Date((subscription.current_period_end || 0) * 1000);

      // Find user by Stripe customer ID
      const userResult = await db.select().from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        console.log(`[Stripe Webhook] Subscription ${event.type} for user ${user.id}`);

        const updateData: any = {
          stripeSubscriptionId: subscription.id,
          subscriptionExpiresAt: periodEnd,
        };

        // Update plan based on subscription status
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          updateData.subscriptionPlan = planId as 'free' | 'professional' | 'enterprise';
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          updateData.subscriptionPlan = 'free';
        }

        await db.update(users).set(updateData).where(eq(users.id, user.id));
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const userResult = await db.select().from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        console.log(`[Stripe Webhook] Subscription deleted for user ${user.id}`);

        // Downgrade to free plan
        await db.update(users).set({
          subscriptionPlan: 'free',
          stripeSubscriptionId: null,
          subscriptionExpiresAt: null,
        }).where(eq(users.id, user.id));
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;
      const subscriptionId = invoice.subscription as string;

      console.log(`[Stripe Webhook] Invoice paid for customer ${customerId}`);

      // Update subscription expiration if needed
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const periodEnd = new Date((subscription.current_period_end || 0) * 1000);

        const userResult = await db.select().from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (userResult.length > 0) {
          await db.update(users).set({
            subscriptionExpiresAt: periodEnd,
          }).where(eq(users.id, userResult[0].id));
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      console.log(`[Stripe Webhook] Payment failed for customer ${customerId}`);
      // Could send notification to user here
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return { received: true, type: event.type };
}

/**
 * Express route for webhook endpoint
 * Note: This must be registered BEFORE express.json() middleware
 */
stripeRouter.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    const result = await handleStripeWebhook(req.body, signature);
    res.json(result);
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error.message);
    res.status(400).json({ error: error.message });
  }
});
