"use client";

import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AvatarUpload() {
  const {
    currentAvatarUrl,
    initials,
    error,
    isPending,
    fileInputRef,
    handleFileSelect,
    triggerFileSelect,
  } = useAvatarUpload();

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-4">Profile Photo</h2>
      <div className="flex items-center gap-4">
        <Avatar size="lg" className="size-16">
          {currentAvatarUrl && <AvatarImage src={currentAvatarUrl} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileSelect}
            disabled={isPending}
          >
            {isPending ? "Uploading..." : "Change Photo"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG, GIF. Max 2MB.</p>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
