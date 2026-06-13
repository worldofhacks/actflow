export class TokenManager {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshInFlight: Promise<void> | null = null;

  constructor(
    private authRequest: () => Promise<string>,
    private tokenLifetimeMins: number = 55
  ) {}

  async getValidToken(): Promise<string> {
    if (!this.isTokenValid()) {
      await this.refreshToken();
    }
    return this.token!;
  }

  private isTokenValid(): boolean {
    return (
      this.token !== null &&
      this.tokenExpiry !== null &&
      Date.now() < this.tokenExpiry
    );
  }

  /**
   * Refreshes the token. Concurrent callers share a single in-flight
   * auth request instead of each triggering their own login.
   */
  private refreshToken(): Promise<void> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = (async () => {
        this.token = await this.authRequest();
        this.tokenExpiry = Date.now() + this.tokenLifetimeMins * 60 * 1000;
      })().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  invalidateToken(): void {
    this.token = null;
    this.tokenExpiry = null;
  }
}
