import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrivateKey } from './types';

@Injectable()
export class WalletEncryptionService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-cbc';

  constructor(private configService: ConfigService) {
    // Ensure you have a secure encryption key in your environment variables
    const key = this.configService.get<string>('WALLET_ENCRYPTION_KEY');
    if (!key) {
      throw new Error('WALLET_ENCRYPTION_KEY must be set in environment');
    }
    this.encryptionKey = key;
  }

  /**
   * Encrypt private key
   * @param privateKey Raw private key to encrypt
   * @returns Encrypted string
   */
  encryptPrivateKey(privateKey: string): string {
    // Create a fixed-length buffer from the key
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();

    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV and encrypted data concatenated
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt private key
   * @param encryptedPrivateKey Encrypted private key string
   * @returns Decrypted private key
   */
  decryptPrivateKey(encryptedPrivateKey: string): PrivateKey {
    // Create a fixed-length buffer from the key
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();

    // Split IV and encrypted data
    const [ivHex, encryptedData] = encryptedPrivateKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
