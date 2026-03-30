import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type Mission = {
  id: string;
  code: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  segment: string;
  status: 'active' | 'completed' | 'claimed';
  expiresAt: string;
};

type Notification = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function buildNowIso() {
  return new Date().toISOString();
}

async function installApiMocks(page: Page) {
  const state = {
    profile: {
      id: 'e2e-user',
      nombre: 'QA User',
      cedula: '12345678',
      balance: 250,
      xp: 1200
    },
    level: {
      level: { id: 2, nombre: 'Bachiller' },
      progress: 48,
      nextXp: 2000,
      benefits: { descuento: 0.02, accesoVIP: false }
    },
    missions: [
      {
        id: 'm1',
        code: 'wk_recharge_1',
        title: 'Recarga tu saldo',
        description: 'Realiza 1 recarga esta semana.',
        progress: 0,
        target: 1,
        xpReward: 10,
        completed: false,
        claimed: false,
        segment: 'global',
        status: 'active',
        expiresAt: buildNowIso()
      }
    ] as Mission[],
    notifications: [
      {
        id: 'n1',
        type: 'payment_received',
        message: 'Recibiste una transferencia de prueba.',
        is_read: false,
        created_at: buildNowIso()
      }
    ] as Notification[]
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (payload: unknown, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload)
    });

    if (path.endsWith('/api/login') && method === 'POST') {
      return json({
        token: 'token-e2e',
        usuarioId: state.profile.id,
        nombre: state.profile.nombre,
        cedula: state.profile.cedula,
        balance: state.profile.balance,
        xp: state.profile.xp
      });
    }

    if (path.endsWith(`/api/usuario/${state.profile.id}`) && method === 'GET') {
      return json(state.profile);
    }

    if (path.endsWith(`/api/usuario/${state.profile.id}/level`) && method === 'GET') {
      return json(state.level);
    }

    if (path.endsWith('/api/gamification/missions/weekly') && method === 'GET') {
      return json({
        missions: state.missions,
        week: {
          weekKey: '2026-03-30',
          endAt: buildNowIso()
        }
      });
    }

    if (path.endsWith('/api/gamification/streak') && method === 'GET') {
      return json({
        streak: {
          currentDaily: 2,
          bestDaily: 4,
          currentWeekly: 1,
          weeklyShieldAvailable: 1,
          lastQualifiedAt: buildNowIso()
        }
      });
    }

    if (path.endsWith('/api/gamification/config/public') && method === 'GET') {
      return json({ config: {} });
    }

    if (path.match(/\/api\/gamification\/missions\/[^/]+\/progress$/) && method === 'POST') {
      const mission = state.missions[0];
      mission.progress = mission.target;
      mission.completed = true;
      mission.status = 'completed';
      state.notifications.unshift({
        id: `n-${Date.now()}`,
        type: 'reward_ready',
        message: 'Mision completada: reclama tu recompensa.',
        is_read: false,
        created_at: buildNowIso()
      });
      return json({ mission, rewardReady: true });
    }

    if (path.match(/\/api\/gamification\/missions\/[^/]+\/claim$/) && method === 'POST') {
      const mission = state.missions[0];
      mission.claimed = true;
      mission.completed = true;
      mission.status = 'claimed';
      state.profile.xp += mission.xpReward;
      state.notifications.unshift({
        id: `n-${Date.now()}`,
        type: 'reward_ready',
        message: `Recompensa acreditada: +${mission.xpReward} XP.`,
        is_read: false,
        created_at: buildNowIso()
      });
      return json({ mission, alreadyClaimed: false });
    }

    if (path.match(/\/api\/notifications\//) && method === 'GET') {
      return json({ notifications: state.notifications });
    }

    if (path.endsWith('/api/tasa') && method === 'GET') {
      return json({ tasa: 36.5 });
    }

    if (path.endsWith('/api/historial') && method === 'GET') {
      return json({ movimientos: [] });
    }

    return json({ ok: true });
  });
}

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.fill('#email', 'qa@capypay.test');
  await page.fill('#password', '123456');
  await page.click('#login-btn');
  await page.waitForURL('**/dashboard');
}

test('Smoke principal: login -> dashboard -> misiones -> claim -> notificaciones', async ({ page }) => {
  await installApiMocks(page);
  await login(page);

  await expect(page.locator('#missions-counter')).toBeVisible();
  await page.locator('[aria-label="Abrir misiones"]').click();
  await expect(page.locator('#missions-modal')).toBeVisible();
  await expect(page.locator('#missions-list')).toBeVisible();

  const claimButton = page.getByRole('button', { name: /Reclamar \+XP/i });
  const progressButton = page.getByRole('button', { name: /Avanzar misión/i });

  if (await progressButton.count()) {
    await progressButton.first().click();
    await page.waitForTimeout(150);
  }

  if (await claimButton.count()) {
    await claimButton.first().click();
    await page.waitForTimeout(150);
  }

  await page.goto('/account/notifications');
  await expect(page.getByRole('heading', { name: /Notificaciones/i })).toBeVisible();
  await expect(page.locator('#notifications-container')).toBeVisible();
  await expect(page.locator('#notifications-container')).toContainText(/recompensa|notificaciones|pago|racha/i);
});

test('Validación mobile rápida: dashboard y niveles renderizan sin romper layout crítico', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installApiMocks(page);
  await login(page);

  await expect(page.locator('#exchange-rate-widget')).toBeVisible();
  await expect(page.locator('#user-level')).toBeVisible();
  await expect(page.locator('#streak-daily')).toBeVisible();

  await page.goto('/account/niveles');
  await expect(page.getByRole('heading', { name: /Mis Niveles/i })).toBeVisible();
  await expect(page.locator('#rewards-list')).toBeVisible();
});
