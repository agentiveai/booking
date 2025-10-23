import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/sendgrid';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'E-post er p�krevd' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Hvis e-posten finnes i systemet, vil du motta en lenke for tilbakestilling',
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Tilbakestill passordet ditt',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                        Tilbakestill passordet
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                        Hei ${user.name},
                      </p>

                      <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                        Du har bedt om � tilbakestille passordet ditt. Klikk p� knappen nedenfor for � fortsette:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);">
                              Tilbakestill passordet
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 20px 0 0 0;">
                        Eller kopier og lim inn denne lenken i nettleseren din:
                      </p>
                      <p style="color: #0066FF; font-size: 14px; line-height: 20px; margin: 8px 0 20px 0; word-break: break-all;">
                        ${resetUrl}
                      </p>

                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-top: 30px;">
                        <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0;">
                          <strong>� Viktig:</strong> Denne lenken utl�per om 30 minutter. Hvis du ikke ba om dette, kan du ignorere denne e-posten.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0;">
                        Dette er en automatisk e-post. Ikke svar p� denne meldingen.
                      </p>
                      <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 8px 0 0 0;">
                        � ${new Date().getFullYear()} Booking Platform. Alle rettigheter reservert.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      message: 'Hvis e-posten finnes i systemet, vil du motta en lenke for tilbakestilling',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt. Pr�v igjen senere.' },
      { status: 500 }
    );
  }
}
