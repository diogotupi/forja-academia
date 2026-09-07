import Stripe from "stripe";
let instance:Stripe|undefined;
export function getStripe(){if(!process.env.STRIPE_SECRET_KEY)throw new Error("STRIPE_SECRET_KEY não configurada");instance??=new Stripe(process.env.STRIPE_SECRET_KEY);return instance}
