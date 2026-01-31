import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { t, formatTime } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDialog } from "@/components/settings-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { MessageCircle, Plus, Globe, LogOut, Users, Megaphone, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatWithDetails, UserProfile } from "@shared/schema";

interface AppSidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onNewGroup?: () => void;
  onNewChannel?: () => void;
}

function ChatItem({ 
  chat, 
  isActive, 
  onClick,
  currentUserId,
  language 
}: { 
  chat: ChatWithDetails; 
  isActive: boolean; 
  onClick: () => void;
  currentUserId: string;
  language: 'en' | 'ru';
}) {
  const isGroupOrChannel = chat.type === 'group' || chat.type === 'channel';
  const otherParticipant = chat.participants.find(p => p.userId !== currentUserId);
  
  const displayName = isGroupOrChannel 
    ? chat.name || (chat.type === 'group' ? t('group', language) : t('channel', language))
    : otherParticipant?.profile?.displayName || otherParticipant?.profile?.tag || "Unknown";
  
  const memberCount = chat.participants.length;
  
  const getAvatar = () => {
    if (chat.type === 'channel') {
      return <Megaphone className="w-4 h-4 text-primary" />;
    }
    if (chat.type === 'group') {
      return <Users className="w-4 h-4 text-primary" />;
    }
    return displayName.charAt(0).toUpperCase();
  };
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onClick}
        isActive={isActive}
        className="h-auto py-3"
        data-testid={`sidebar-chat-${chat.id}`}
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/20 text-primary text-sm flex items-center justify-center">
            {getAvatar()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 ml-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate text-sm">{displayName}</span>
            {chat.lastMessage && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTime(new Date(chat.lastMessage.createdAt!), language)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground truncate">
              {isGroupOrChannel && !chat.lastMessage
                ? `${memberCount} ${chat.type === 'channel' ? t('subscribers', language) : t('members', language)}`
                : chat.lastMessage?.content || t('noMessages', language)}
            </p>
            {chat.unreadCount > 0 && (
              <span className="min-w-4 h-4 px-1 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center shrink-0">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ selectedChatId, onSelectChat, onNewChat, onNewGroup, onNewChannel }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const { data: chats, isLoading: isLoadingChats } = useQuery<ChatWithDetails[]>({
    queryKey: ['/api/chats'],
    refetchInterval: 5000,
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
  });

  const currentUserId = user?.id || "";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">{t('appName', language)}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                data-testid="button-new-menu"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onNewChat} data-testid="menu-new-chat">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t('newChat', language)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewGroup} data-testid="menu-new-group">
                <Users className="mr-2 h-4 w-4" />
                {t('newGroup', language)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewChannel} data-testid="menu-new-channel">
                <Megaphone className="mr-2 h-4 w-4" />
                {t('newChannel', language)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {isLoadingChats ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : chats && chats.length > 0 ? (
              <SidebarMenu>
                {chats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={selectedChatId === chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    currentUserId={currentUserId}
                    language={language}
                  />
                ))}
              </SidebarMenu>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium">{t('noChats', language)}</p>
                <p className="text-sm text-muted-foreground">{t('startChatting', language)}</p>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {(profile?.displayName || user?.firstName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">
              {profile?.displayName || user?.firstName || t('profile', language)}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{profile?.tag || "user"}
            </p>
          </div>
          <SettingsDialog />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
            data-testid="button-language"
            title={language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
          >
            <Globe className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            data-testid="button-logout"
            title={t('logout', language)}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
