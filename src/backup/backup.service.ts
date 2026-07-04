import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { gzipSync } from 'zlib';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly configService: ConfigService) {}

  async createBackup(): Promise<{ buffer: Buffer; filename: string }> {
    const sqlDump = await this.runPgDump();
    const buffer = gzipSync(sqlDump);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbName = this.configService.get<string>('DB_NAME', 'abk_db');
    const filename = `${dbName}_backup_${stamp}.sql.gz`;

    this.logger.log(
      `Database backup created: ${filename} (${buffer.length} bytes)`,
    );

    return { buffer, filename };
  }

  private runPgDump(): Promise<Buffer> {
    const host = this.configService.get<string>('DB_HOST', 'localhost');
    const port = this.configService.get<string>('DB_PORT', '5432');
    const username = this.configService.get<string>('DB_USERNAME', 'postgres');
    const password = this.configService.get<string>('DB_PASSWORD', 'postgres');
    const database = this.configService.get<string>('DB_NAME', 'abk_db');

    return new Promise((resolve, reject) => {
      const args = [
        '-h',
        host,
        '-p',
        String(port),
        '-U',
        username,
        '-d',
        database,
        '--no-owner',
        '--no-acl',
      ];

      const proc = spawn('pg_dump', args, {
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      proc.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      proc.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

      proc.on('error', (error) => {
        this.logger.error(`pg_dump failed to start: ${error.message}`);
        reject(
          new InternalServerErrorException(
            'Database backup tool (pg_dump) is not available on the server',
          ),
        );
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
          this.logger.error(`pg_dump exited with code ${code}: ${stderr}`);
          reject(
            new InternalServerErrorException(
              stderr || 'Failed to create database backup',
            ),
          );
          return;
        }

        resolve(Buffer.concat(stdoutChunks));
      });
    });
  }
}
