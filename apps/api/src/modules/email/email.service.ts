import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly config: ConfigService) {}

  async send(to: string, subject: string, html: string): Promise<void> {
    const key = this.config.get<string>('RESEND_API_KEY');
    if (!key) { this.logger.warn(`email_skipped subject=${subject}`); return; }
    try {
      await new Resend(key).emails.send({ from: this.config.get<string>('EMAIL_FROM') ?? 'Atelier <onboarding@resend.dev>', to, subject, html });
    } catch (error) { this.logger.error(`email_failed subject=${subject}`, error); }
  }

  welcome(email: string, name: string | null) { return this.send(email, 'Bem-vinda ao Atelier', `<p>Olá ${name ?? ''},</p><p>Sua conta foi criada com sucesso.</p>`); }
  passwordReset(email: string, name: string | null, url: string) { return this.send(email, 'Redefinição de senha', `<p>Olá ${name ?? ''},</p><p><a href="${url}">Redefinir minha senha</a></p><p>Este link expira em 1 hora e só pode ser usado uma vez.</p>`); }
  passwordChanged(email: string, name: string | null) { return this.send(email, 'Senha alterada', `<p>Olá ${name ?? ''},</p><p>Sua senha foi alterada e as sessões anteriores foram encerradas.</p>`); }
  order(email: string, name: string | null, orderId: string, message: string) { return this.send(email, `Pedido #${orderId.slice(0, 8).toUpperCase()}`, `<p>Olá ${name ?? ''},</p><p>${message}</p>`); }
  async orderCreated(email: string, name: string | null, orderId: string) {
    await this.order(email, name, orderId, 'Recebemos seu pedido e aguardamos o pagamento.');
    const admin = this.config.get<string>('ADMIN_EMAIL');
    if (admin) await this.order(admin, 'Admin', orderId, 'Um novo pedido foi criado.');
  }
}
