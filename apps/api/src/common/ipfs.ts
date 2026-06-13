import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import FormData from 'form-data';

@Injectable()
export class PinataIPFSClient {
  private readonly logger = new Logger(PinataIPFSClient.name);
  private jwt: string | undefined;

  /**
   * In-memory store backing the offline stub (no PINATA_JWT configured).
   * TODO(stub): set PINATA_JWT to pin metadata for real; this stub only keeps
   * uploads for the lifetime of the process so the app can boot offline.
   */
  private readonly offlineStore = new Map<string, any>();

  constructor() {
    this.jwt = process.env.PINATA_JWT;
    if (!this.jwt) {
      this.logger.warn(
        'PINATA_JWT not set - PinataIPFSClient is running as an in-memory stub (uploads are not pinned to IPFS)',
      );
    }
  }

  private get isStub(): boolean {
    return !this.jwt;
  }

  private fakeCid(content: Buffer | string): string {
    // Deterministic pseudo-CID for offline dev; NOT a real IPFS CID.
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `stub-${hash.slice(0, 46)}`;
  }

  async uploadJSON(data: any): Promise<string> {
    if (this.isStub) {
      const cid = this.fakeCid(JSON.stringify(data));
      this.offlineStore.set(cid, data);
      return cid;
    }
    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.jwt}`,
        },
      });

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw new Error(`Failed to upload to Pinata: ${error.message}`);
    }
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    if (this.isStub) {
      const cid = this.fakeCid(file);
      this.offlineStore.set(cid, file);
      return cid;
    }
    try {
      const formData = new FormData();
      formData.append('file', file, filename);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            Authorization: `Bearer ${this.jwt}`,
          },
        },
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Pinata file upload error:', error);
      throw new Error(`Failed to upload file to Pinata: ${error.message}`);
    }
  }

  async getFromIPFS(cid: string): Promise<any> {
    if (this.isStub) {
      // Sensible static shape so callers do not crash in offline dev.
      return this.offlineStore.get(cid) ?? { metadata: 'metadata', payload: 'payload' };
    }
    // NOTE: preserved from the source: the original implementation also short-circuited
    // with this static shape before ever hitting the gateway.
    return {
      metadata: 'metadata',
      payload: 'payload',
    };
    /* eslint-disable no-unreachable */
    try {
      const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
      const response = await axios.get(`${gateway}${cid}`);
      return response.data;
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      return null;
    }
    /* eslint-enable no-unreachable */
  }
}
