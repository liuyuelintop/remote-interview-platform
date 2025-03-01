"use client";

// Clerk的React上下文
import { ClerkProvider, useAuth } from "@clerk/nextjs";
// Convex的React客户端
import { ConvexReactClient } from "convex/react";
// 集成Clerk认证的Convex Provider
import { ConvexProviderWithClerk } from "convex/react-clerk";

// 步骤0: 创建Convex客户端并将其提供给ConvexClerkProvider
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    // 步骤1: 提供Clerk上下文
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      {/* 步骤2: 将Clerk认证状态注入Convex */}
      <ConvexProviderWithClerk
        client={convex} // 上一步初始化的Convex客户端
        useAuth={useAuth} // 从Clerk上下文中获取认证状态
      >
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default ConvexClerkProvider;
