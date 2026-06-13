/**
 * Utility for parsing social media URLs and extracting usernames
 */
export class SocialUrlParser {
  static parseTwitterUrl(url: string): string | null {
    try {
      const regex = /(?:x\.com|x\.com)\/(?:#!\/)?([^\/\?#]+)/i;
      const match = url.match(regex);
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  static parseYoutubeUrl(url: string): string | null {
    try {
      // Handle channel URLs
      let regex = /(?:youtube\.com\/(?:c\/|channel\/|user\/))([^\/\?#]+)/i;
      let match = url.match(regex);

      if (match && match[1]) {
        return match[1];
      }

      // Handle @username format
      regex = /(?:youtube\.com\/)(@[^\/\?#]+)/i;
      match = url.match(regex);

      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  static parseInstagramUrl(url: string): string | null {
    try {
      const regex = /instagram\.com\/([^\/\?#]+)/i;
      const match = url.match(regex);
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  static parseTikTokUrl(url: string): string | null {
    try {
      const regex = /tiktok\.com\/@([^\/\?#]+)/i;
      const match = url.match(regex);
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  static parseLinkedInUrl(url: string): string | null {
    try {
      const regex = /linkedin\.com\/in\/([^\/\?#]+)/i;
      const match = url.match(regex);
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  static parseFacebookUrl(url: string): string | null {
    try {
      const regex = /facebook\.com\/([^\/\?#]+)/i;
      const match = url.match(regex);
      return match && match[1] ? match[1] : null;
    } catch {
      return null;
    }
  }

  static parseAny(url: string): { platform: string; username: string } | null {
    if (!url) return null;

    const urlLower = url.toLowerCase();

    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
      const username = this.parseTwitterUrl(url);
      return username ? { platform: 'twitter', username } : null;
    }

    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      const username = this.parseYoutubeUrl(url);
      return username ? { platform: 'youtube', username } : null;
    }

    if (urlLower.includes('instagram.com')) {
      const username = this.parseInstagramUrl(url);
      return username ? { platform: 'instagram', username } : null;
    }

    if (urlLower.includes('tiktok.com')) {
      const username = this.parseTikTokUrl(url);
      return username ? { platform: 'tiktok', username } : null;
    }

    if (urlLower.includes('linkedin.com')) {
      const username = this.parseLinkedInUrl(url);
      return username ? { platform: 'linkedin', username } : null;
    }

    if (urlLower.includes('facebook.com')) {
      const username = this.parseFacebookUrl(url);
      return username ? { platform: 'facebook', username } : null;
    }

    return null;
  }
}
