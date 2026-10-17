import { MAX_CHAT_MESSAGE_LENGTH, MAX_QUEUE_ITEMS } from "../constants";
import { normalizeYoutubeVideoId } from "../utils/youtubeUtils";

export function validateChatMessage(body: string): string | null {
  const trimmed = body.trim();

  if (!trimmed) {
    return "Message cannot be empty.";
  }

  if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
    return `Message cannot exceed ${MAX_CHAT_MESSAGE_LENGTH} characters.`;
  }

  return null;
}

export function validateYoutubeVideoId(input: string): string | null {
  const videoId = normalizeYoutubeVideoId(input);

  if (!videoId) {
    return "Invalid YouTube video URL or video ID.";
  }

  return null;
}

export function validateQueueSize(currentSize: number): string | null {
  if (currentSize >= MAX_QUEUE_ITEMS) {
    return `Queue cannot contain more than ${MAX_QUEUE_ITEMS} items.`;
  }

  return null;
}