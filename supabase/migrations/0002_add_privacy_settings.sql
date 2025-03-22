-- Add privacy_settings column to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN privacy_settings JSONB DEFAULT jsonb_build_object(
  'publicProfile', false,
  'showPlaylists', true,
  'allowDataCollection', true,
  'shareListeningHistory', false
);

-- Migrate existing rows to have default privacy settings
UPDATE public.user_preferences
SET privacy_settings = jsonb_build_object(
  'publicProfile', false,
  'showPlaylists', true,
  'allowDataCollection', true,
  'shareListeningHistory', false
)
WHERE privacy_settings IS NULL; 