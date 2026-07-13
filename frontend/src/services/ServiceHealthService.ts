import { apiClient } from '@/api/client';

export type ServiceHealth = 'Running' | 'Offline' | 'Unknown';

export interface ServiceStatus {
  name: string;
  health: ServiceHealth;
}

export class ServiceHealthService {
  private static async probe(path: string): Promise<ServiceHealth> {
    try {
      await apiClient.get(path, { timeout: 5000 });
      return 'Running';
    } catch (err) {
      // If we got an HTTP response (even 4xx/5xx), the service IS running
      if (err && typeof err === 'object' && 'response' in err) {
        return 'Running';
      }
      // Network error = service is offline or unknown
      return 'Unknown';
    }
  }

  static async getAllServiceHealth(): Promise<ServiceStatus[]> {
    const [gateway, transaction, healing, observer, notification] = await Promise.all([
      ServiceHealthService.probe('/actuator/health').then(h => h === 'Running' ? 'Running' as ServiceHealth : 'Offline' as ServiceHealth),
      ServiceHealthService.probe('/api/v1/transactions'),
      ServiceHealthService.probe('/api/v1/healing'),
      ServiceHealthService.probe('/api/v1/observer/kubernetes'),
      ServiceHealthService.probe('/api/v1/notifications'),
    ]);

    return [
      { name: 'Gateway', health: gateway },
      { name: 'Transaction Service', health: transaction },
      { name: 'Healing Service', health: healing },
      { name: 'Observer Service', health: observer },
      { name: 'Notification Service', health: notification },
    ];
  }
}
