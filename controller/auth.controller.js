import { Webhook } from 'svix';
import { CLERK_WEBHOOK_SECRET } from '../config/env.js';
import User from '../models/user.model.js';

export const clerkWebhook = async (req, res) => {
  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  try {
    const evt = wh.verify(req.body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });

    console.log('✅ Verified:', evt.type);

    const data = evt.data;

    if (evt.type === 'user.created') {
      await User.create({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email_addresses[0]?.email_address || '',
        userType: data.unsafe_metadata?.userType || 0,
        clerkId: data.id,
        imageUrl: data.image_url || '',
      });
      console.log('✅ User created!');
    }

    // else if (evt.type === 'user.updated') {
    //   await User.findOneAndUpdate(
    //     { clerkId: data.id },
    //     {
    //       firstName: data.first_name || '',
    //       lastName: data.last_name || '',
    //       email: data.email_addresses[0]?.email_address || '',
    //       userType: data.unsafe_metadata?.userType || 0,
    //       imageUrl: data.image_url || '',
    //     },
    //     { new: true, upsert: true } // upsert for safety
    //   );
    //   console.log('✅ User updated!');
    // }

    else if (evt.type === 'user.deleted') {
      await User.findOneAndDelete({ clerkId: data.id });
      console.log('✅ User deleted!');
    }

    else {
      console.log('Unhandled event type:', evt.type);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Verify failed:', err);
    res.status(400).send('Invalid');
  }
};
