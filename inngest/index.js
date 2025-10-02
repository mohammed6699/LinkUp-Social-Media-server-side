import { Inngest } from "inngest";
import User from './../models/user.js';
import Connection from "./../models/connection.js";
import sendEmail from "../configs/nodemiller.js";
import dotenv from 'dotenv';
dotenv.config();
// Create a client to send and receive events
export const inngest = new Inngest({ id: "LinkUp" });
// Inngest function to save user data in the data base
const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event: 'clerk/user.created'},
    async ({event}) => {
        const {id, first_name, last_name,email_addresses, image_url} = event.data
        let username = email_addresses[0].email_address.split('@')[0];

        // check availability of user name
        const user = await User.findOne({username})
        if(user){
            username = username + Math.floor(Math.random() * 10000);
        }
        const userdata = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
            username
        }
        await User.create(userdata)
    }
)
// Inngest function to update user in data base
const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-with-clerk'},
    {event: 'clerk/user.updated'},
    async ({event}) => {
        const {id, first_name, last_name,email_addresses, image_url} = event.data
        const updateUserData = {
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
        }
        await User.findByIdAndUpdate(id, updateUserData, { upsert: true, new: true })
    }
)
// Inngest function to delete user from data base
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-from-clerk'},
    {event: 'clerk/user.deleted'},
    async ({event}) => {
        const {id} = event.data
        await User.findByIdAndDelete(id)
    }
)
// Ingext function to send reminder email when a new connection is send
// one will send immedialtly when a connection request is sent and the other after 24 hours if teh connection is not accept 
// Helper to generate email body
function getConnectionEmailTemplate(connection, isReminder = false) {
  const subject = isReminder 
    ? `⏰ Reminder: You’ve got a pending connection request!` 
    : `🚀 You’ve got a new connection request!`;

  const body = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8" />
      <title>Connection Request</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color:#f4f6f8;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8; padding:40px 0;">
      <tr>
          <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
              <td style="background:linear-gradient(135deg, #4f46e5, #06b6d4); padding:30px; text-align:center; color:#ffffff;">
                  <h1 style="margin:0; font-size:24px;">${isReminder ? 'Reminder: Connection Request' : 'New Connection Request'}</h1>
              </td>
              </tr>
              
              <!-- Body -->
              <tr>
              <td style="padding:30px; color:#333;">
                  <p style="font-size:16px; margin:0 0 15px;">Hi <strong>${connection.to_user_id.full_name}</strong>,</p>
                  <p style="font-size:16px; margin:0 0 15px;">
                  <strong>${connection.from_user_id.full_name}</strong> has sent you a connection request. 🚀  
                  Expand your network and start collaborating today!
                  </p>
                  <p style="font-size:16px; margin:0 0 25px;">
                  ${isReminder ? "Don’t miss this opportunity — check it out now." : "Don’t keep opportunities waiting — check it out now."}
                  </p>

                  <div style="text-align:center;">
                  <a href="${process.env.FRONTEND_URL}/connections" 
                      style="display:inline-block; padding:12px 24px; font-size:16px; font-weight:bold; color:#fff; 
                              background:#4f46e5; border-radius:8px; text-decoration:none;">
                      View Request
                  </a>
                  </div>
              </td>
              </tr>
              
              <!-- Footer -->
              <tr>
              <td style="background:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#777;">
                  <p style="margin:0;">You’re receiving this email because you’re a registered member of <strong>SkillLink</strong>.</p>
                  <p style="margin:5px 0 0;">&copy; ${new Date().getFullYear()} SkillLink. All rights reserved.</p>
              </td>
              </tr>
              
          </table>
          </td>
      </tr>
      </table>
  </body>
  </html>
  `;

  return { subject, body };
}

// Main Inngest function
export const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: 'send-new-connection-request-reminder' },
  { event: 'app/connection-request' },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    // Send initial email
    await step.run('send-connection-request-email', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
      const { subject, body } = getConnectionEmailTemplate(connection);
      await sendEmail({ to: connection.to_user_id.email, subject, body });
    });

    // Wait 24 hours
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait for 24 hours", in24Hours);

    // Send reminder if still pending
    await step.run('send-connection-request-reminder', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
      if (connection.status === 'accepted') {
        return { message: 'already accepted' };
      }
      const { subject, body } = getConnectionEmailTemplate(connection, true);
      await sendEmail({ to: connection.to_user_id.email, subject, body });
      return { message: 'reminder sent' };
    });
  }
);


// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion, sendNewConnectionRequestReminder];