import React, { useState } from "react";
import { ChatProvider } from "@/contexts/ChatContext";
import { UserProvider, useUserContext } from "@/contexts/UserContext";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";
import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import Login from "./Login";

function AuthenticatedApp() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isMobile) {
    return (
      <ChatProvider>
        <div className="h-screen flex flex-col bg-background">
          {/* Mobile Header with Menu */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <h1 className="text-lg font-semibold">LedMKT</h1>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh]">
                <div className="h-full">
                  <ChatSidebar onConversationSelect={() => setDrawerOpen(false)} />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatArea />
          </div>
        </div>
        <Toaster />
      </ChatProvider>
    );
  }

  // Desktop layout
  return (
    <ChatProvider>
      <div className="h-screen flex bg-background">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <ChatSidebar />
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatArea />
        </div>
      </div>
      <Toaster />
    </ChatProvider>
  );
}

const Index = () => {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  );
};

function MainApp() {
  const { isAuthenticated } = useUserContext();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

export default Index;