import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import type { UserProfile } from "@shared/schema";

export function SettingsDialog() {
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
  });

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    language: language,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: { displayName?: string; bio?: string; language?: string }) => {
      return apiRequest('PATCH', '/api/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({ title: t('save', language) });
      setOpen(false);
    },
    onError: () => {
      toast({ title: t('error', language), variant: "destructive" });
    }
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && profile) {
      setFormData({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        language: profile.language || language,
      });
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    // Sync language to local state
    if (formData.language !== language) {
      setLanguage(formData.language as 'en' | 'ru');
    }
    
    updateProfile.mutate({
      displayName: formData.displayName || undefined,
      bio: formData.bio || undefined,
      language: formData.language,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings', language)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayName', language)}</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder={t('displayName', language)}
              data-testid="input-display-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">{t('tag', language)}</Label>
            <Input
              id="tag"
              value={`@${profile?.tag || 'user'}`}
              disabled
              className="bg-muted"
              data-testid="input-tag"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t('bio', language)}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t('bio', language)}
              className="resize-none"
              rows={3}
              data-testid="input-bio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t('language', language)}</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value })}
            >
              <SelectTrigger data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en" data-testid="select-item-en">English</SelectItem>
                <SelectItem value="ru" data-testid="select-item-ru">Русский</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
            {t('cancel', language)}
          </Button>
          <Button onClick={handleSave} disabled={updateProfile.isPending} data-testid="button-save">
            {t('save', language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
