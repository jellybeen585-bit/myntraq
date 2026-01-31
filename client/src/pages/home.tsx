import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { t, formatTime } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useToast } from "@/hooks/use-toast";
import type { ChatWithDetails, MessageWithSender, UserProfile } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MessageCircle, Send, Search, X, Users, Megaphone, Lock, Settings, Trash2, LogOut, UserPlus, Crown, Shield, Paperclip, Image, Mic, Video, Play, Pause, MoreVertical } from "lucide-react";

function MessageBubble({ 
  message, 
  isOwn, 
  language 
}: { 
  message: MessageWithSender; 
  isOwn: boolean;
  language: 'en' | 'ru';
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isOwn 
            ? 'bg-primary text-primary-foreground rounded-br-sm' 
            : 'bg-card border border-border rounded-bl-sm'
        }`}
        data-testid={`message-bubble-${message.id}`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {formatTime(new Date(message.createdAt!), language)}
        </p>
      </div>
    </div>
  );
}

function ChatView({ 
  chatId,
  currentUserId,
  language,
  onChatDeleted,
}: { 
  chatId: string;
  currentUserId: string;
  language: 'en' | 'ru';
  onChatDeleted?: () => void;
}) {
  const [messageText, setMessageText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery<MessageWithSender[]>({
    queryKey: ['/api/chats', chatId, 'messages'],
    refetchInterval: 3000,
  });

  const { data: chatDetails } = useQuery<ChatWithDetails>({
    queryKey: ['/api/chats', chatId],
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/chats/${chatId}/messages`, { content });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const deleteGroup = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/groups/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      onChatDeleted?.();
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const leaveGroup = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/groups/${chatId}/members/${currentUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      onChatDeleted?.();
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      return apiRequest('PATCH', `/api/groups/${chatId}/members/${memberId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      return apiRequest('DELETE', `/api/groups/${chatId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isGroupOrChannel = chatDetails?.type === 'group' || chatDetails?.type === 'channel';
  const isChannel = chatDetails?.type === 'channel';
  const otherParticipant = chatDetails?.participants.find(p => p.userId !== currentUserId);
  const currentParticipant = chatDetails?.participants.find(p => p.userId === currentUserId);
  const isAdmin = currentParticipant?.role === 'admin';
  const isCreator = chatDetails?.createdBy === currentUserId;
  const canPost = !isChannel || isAdmin;
  
  const displayName = isGroupOrChannel 
    ? chatDetails?.name || (isChannel ? t('channel', language) : t('group', language))
    : otherParticipant?.profile?.displayName || otherParticipant?.profile?.tag || "Chat";
  
  const memberCount = chatDetails?.participants.length || 0;

  const getAvatar = () => {
    if (isChannel) {
      return <Megaphone className="w-4 h-4 text-primary" />;
    }
    if (chatDetails?.type === 'group') {
      return <Users className="w-4 h-4 text-primary" />;
    }
    return displayName.charAt(0).toUpperCase();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && canPost) {
      sendMessage.mutate(messageText.trim());
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center justify-between px-4 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden" data-testid="button-sidebar-toggle" />
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/20 text-primary flex items-center justify-center">
              {chatDetails?.iconUrl ? (
                <AvatarImage src={chatDetails.iconUrl} alt={displayName} />
              ) : getAvatar()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium text-sm">{displayName}</h2>
            <p className="text-xs text-muted-foreground">
              {isGroupOrChannel 
                ? `${memberCount} ${isChannel ? t('subscribers', language) : t('members', language)}${isAdmin ? ` • ${t('youAreAdmin', language)}` : ''}`
                : otherParticipant?.profile?.isOnline ? t('online', language) : t('offline', language)
              }
            </p>
          </div>
        </div>
        
        {isGroupOrChannel && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-chat-settings">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => setShowSettings(true)} data-testid="menu-edit-group">
                    <Settings className="h-4 w-4 mr-2" />
                    {isChannel ? t('editChannel', language) : t('editGroup', language)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddMembers(true)} data-testid="menu-add-members">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('addMembers', language)}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!isCreator && (
                <DropdownMenuItem 
                  onClick={() => leaveGroup.mutate()} 
                  className="text-destructive"
                  data-testid="menu-leave-group"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isChannel ? t('leaveChannel', language) : t('leaveGroup', language)}
                </DropdownMenuItem>
              )}
              {isCreator && (
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="text-destructive"
                  data-testid="menu-delete-group"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isChannel ? t('deleteChannel', language) : t('deleteGroup', language)}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isChannel ? t('deleteChannel', language) : t('deleteGroup', language)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isChannel ? t('deleteChannelConfirm', language) : t('deleteGroupConfirm', language)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', language)}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteGroup.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isChannel ? t('deleteChannel', language) : t('deleteGroup', language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-12 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                language={language}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('noMessages', language)}</p>
            <p className="text-sm text-muted-foreground">{t('sendFirstMessage', language)}</p>
          </div>
        )}
      </ScrollArea>

      {canPost ? (
        <form onSubmit={handleSend} className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('typeMessage', language)}
              className="flex-1"
              data-testid="input-message"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!messageText.trim() || sendMessage.isPending}
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Lock className="h-4 w-4" />
            <span>{t('onlyAdminsCanPost', language)}</span>
          </div>
        </div>
      )}

      <GroupSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        chatDetails={chatDetails}
        language={language}
        currentUserId={currentUserId}
      />

      <AddMembersDialog
        open={showAddMembers}
        onOpenChange={setShowAddMembers}
        chatId={chatId}
        language={language}
        existingMemberIds={chatDetails?.participants.map(p => p.userId) || []}
      />
    </div>
  );
}

function NewChatDialog({ 
  open,
  onOpenChange,
  language,
  onChatCreated 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ru';
  onChatCreated: (chatId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: searchResults, isLoading: isSearching } = useQuery<UserProfile[]>({
    queryKey: ['/api/users/search', searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const startChat = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest('POST', '/api/chats', { participantId: userId });
      return res.json();
    },
    onSuccess: (data) => {
      onOpenChange(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      onChatCreated(data.id);
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newChat', language)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchUsers', language)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>
          
          <ScrollArea className="max-h-64">
            {isSearching ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer text-left"
                    onClick={() => startChat.mutate(user.userId)}
                    data-testid={`search-result-${user.userId}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(user.displayName || user.tag).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.displayName || user.tag}</p>
                      <p className="text-sm text-muted-foreground">@{user.tag}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-muted-foreground py-4">{t('noResults', language)}</p>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateGroupDialog({ 
  open,
  onOpenChange,
  language,
  type,
  onCreated 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ru';
  type: 'group' | 'channel';
  onCreated: (chatId: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: searchResults, isLoading: isSearching } = useQuery<UserProfile[]>({
    queryKey: ['/api/users/search', searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/groups', { 
        name, 
        description: description || undefined,
        memberIds: selectedMembers,
        type 
      });
      return res.json();
    },
    onSuccess: (data) => {
      onOpenChange(false);
      setName("");
      setDescription("");
      setSearchQuery("");
      setSelectedMembers([]);
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      onCreated(data.id);
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const isChannel = type === 'channel';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isChannel ? <Megaphone className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {isChannel ? t('createChannel', language) : t('createGroup', language)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isChannel ? t('channelName', language) : t('groupName', language)}
              data-testid="input-group-name"
            />
          </div>
          
          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('description', language)}
              className="min-h-[80px] resize-none"
              data-testid="input-group-description"
            />
          </div>

          {isChannel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Lock className="h-4 w-4" />
              <span>{t('onlyAdminsCanPost', language)}</span>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">{t('addMembers', language)}</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchUsers', language)}
                className="pl-9"
                data-testid="input-search-members"
              />
            </div>
          </div>
          
          <ScrollArea className="max-h-48">
            {isSearching ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer text-left"
                    onClick={() => toggleMember(user.userId)}
                    data-testid={`member-${user.userId}`}
                  >
                    <Checkbox 
                      checked={selectedMembers.includes(user.userId)}
                      className="pointer-events-none"
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(user.displayName || user.tag).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.displayName || user.tag}</p>
                      <p className="text-xs text-muted-foreground">@{user.tag}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">{t('noResults', language)}</p>
            ) : null}
          </ScrollArea>

          {selectedMembers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedMembers.length} {t('members', language)}
            </p>
          )}

          <Button 
            onClick={() => createGroup.mutate()}
            disabled={!name.trim() || createGroup.isPending}
            className="w-full"
            data-testid="button-create-group"
          >
            {isChannel ? t('createChannel', language) : t('createGroup', language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupSettingsDialog({
  open,
  onOpenChange,
  chatDetails,
  language,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatDetails: ChatWithDetails | undefined;
  language: 'en' | 'ru';
  currentUserId: string;
}) {
  const [name, setName] = useState(chatDetails?.name || "");
  const [description, setDescription] = useState(chatDetails?.description || "");
  const { toast } = useToast();
  const isChannel = chatDetails?.type === 'channel';
  const chatId = chatDetails?.id;

  useEffect(() => {
    if (chatDetails) {
      setName(chatDetails.name || "");
      setDescription(chatDetails.description || "");
    }
  }, [chatDetails]);

  const updateGroup = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/groups/${chatId}`, { name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      return apiRequest('PATCH', `/api/groups/${chatId}/members/${memberId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      return apiRequest('DELETE', `/api/groups/${chatId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  if (!chatDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isChannel ? <Megaphone className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {isChannel ? t('channelSettings', language) : t('groupSettings', language)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isChannel ? t('channelName', language) : t('groupName', language)}
              data-testid="input-edit-name"
            />
          </div>
          
          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('description', language)}
              className="min-h-[80px] resize-none"
              data-testid="input-edit-description"
            />
          </div>

          <Button 
            onClick={() => updateGroup.mutate()}
            disabled={!name.trim() || updateGroup.isPending}
            className="w-full"
            data-testid="button-save-settings"
          >
            {t('save', language)}
          </Button>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">{t('manageMembers', language)}</p>
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {chatDetails.participants.map((participant) => {
                  const isCreator = participant.userId === chatDetails.createdBy;
                  const isCurrentUser = participant.userId === currentUserId;
                  const canManage = !isCreator && !isCurrentUser && chatDetails.createdBy === currentUserId;
                  
                  return (
                    <div 
                      key={participant.userId}
                      className="flex items-center justify-between p-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {(participant.profile?.displayName || participant.profile?.tag || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {participant.profile?.displayName || participant.profile?.tag}
                            </p>
                            {isCreator && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                            {participant.role === 'admin' && !isCreator && (
                              <Shield className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isCreator ? t('creator', language) : participant.role === 'admin' ? t('admin', language) : t('member', language)}
                          </p>
                        </div>
                      </div>
                      
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {participant.role === 'member' ? (
                              <DropdownMenuItem 
                                onClick={() => updateMemberRole.mutate({ memberId: participant.userId, role: 'admin' })}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {t('makeAdmin', language)}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => updateMemberRole.mutate({ memberId: participant.userId, role: 'member' })}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {t('removeAdmin', language)}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => removeMember.mutate(participant.userId)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('removeMember', language)}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMembersDialog({
  open,
  onOpenChange,
  chatId,
  language,
  existingMemberIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  language: 'en' | 'ru';
  existingMemberIds: string[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: searchResults, isLoading: isSearching } = useQuery<UserProfile[]>({
    queryKey: ['/api/users/search', searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const filteredResults = searchResults?.filter(u => !existingMemberIds.includes(u.userId));

  const addMembers = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/groups/${chatId}/members`, { memberIds: selectedMembers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
      onOpenChange(false);
      setSearchQuery("");
      setSelectedMembers([]);
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('addMembers', language)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchUsers', language)}
              className="pl-9"
              data-testid="input-search-add-members"
            />
          </div>
          
          <ScrollArea className="max-h-48">
            {isSearching ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredResults && filteredResults.length > 0 ? (
              <div className="space-y-1">
                {filteredResults.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer text-left"
                    onClick={() => toggleMember(user.userId)}
                    data-testid={`add-member-${user.userId}`}
                  >
                    <Checkbox 
                      checked={selectedMembers.includes(user.userId)}
                      className="pointer-events-none"
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(user.displayName || user.tag).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.displayName || user.tag}</p>
                      <p className="text-xs text-muted-foreground">@{user.tag}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">{t('noResults', language)}</p>
            ) : null}
          </ScrollArea>

          {selectedMembers.length > 0 && (
            <Button 
              onClick={() => addMembers.mutate()}
              disabled={addMembers.isPending}
              className="w-full"
              data-testid="button-add-members"
            >
              {t('addMembers', language)} ({selectedMembers.length})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newChannelOpen, setNewChannelOpen] = useState(false);

  const currentUserId = user?.id || "";

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar 
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onNewChat={() => setNewChatOpen(true)}
          onNewGroup={() => setNewGroupOpen(true)}
          onNewChannel={() => setNewChannelOpen(true)}
        />
        
        <SidebarInset className="flex flex-col">
          {selectedChatId ? (
            <ChatView
              chatId={selectedChatId}
              currentUserId={currentUserId}
              language={language}
              onChatDeleted={() => setSelectedChatId(null)}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="h-14 border-b border-border flex items-center px-4 md:hidden">
                <SidebarTrigger data-testid="button-menu" />
                <span className="ml-3 font-semibold">{t('chats', language)}</span>
              </div>
              <div className="flex-1 hidden md:flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-medium mb-2">{t('appName', language)}</h2>
                <p className="text-muted-foreground">{t('startChatting', language)}</p>
              </div>
            </div>
          )}
        </SidebarInset>

        <NewChatDialog 
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          language={language}
          onChatCreated={(id) => {
            setSelectedChatId(id);
            setNewChatOpen(false);
          }}
        />

        <CreateGroupDialog 
          open={newGroupOpen}
          onOpenChange={setNewGroupOpen}
          language={language}
          type="group"
          onCreated={(id) => {
            setSelectedChatId(id);
            setNewGroupOpen(false);
          }}
        />

        <CreateGroupDialog 
          open={newChannelOpen}
          onOpenChange={setNewChannelOpen}
          language={language}
          type="channel"
          onCreated={(id) => {
            setSelectedChatId(id);
            setNewChannelOpen(false);
          }}
        />
      </div>
    </SidebarProvider>
  );
}
