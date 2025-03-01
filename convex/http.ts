import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";

// 创建HTTP路由（类似于Express的Router）
const http = httpRouter();

// 定义Clerk用户同步的Webhook路由（类似Express的POST路由）
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // ctx包含数据库上下文
    // 1. 安全验证部分（类似JWT验证）
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    // 获取Clerk的安全头（类似CSRF Token验证）
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    // 2. 验证请求合法性（防止伪造请求）
    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("No svix headers found", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret); // 使用svix库验证签名
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        // 验证签名和时效性
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    const eventType = evt.type;

    // 3. 处理用户创建事件（类似MongoDB的用户同步）
    if (eventType === "user.created") {
      // 当新用户注册时触发
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      // 格式处理（比如用户可能没有姓名）
      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      // 4. 调用Convex的mutation写入数据库（类似Mongoose的create操作）
      try {
        await ctx.runMutation(api.users.syncUser, {
          // 调用定义好的数据库操作
          clerkId: id,
          email,
          name,
          image: image_url,
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

export default http;
