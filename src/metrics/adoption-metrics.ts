import { EventEmitter } from 'events';

export interface AdoptionEvent {
  timestamp: number;
  personaId: string;
  userId?: string;
  sessionId?: string;
  context?: {
    triggerType: 'manual' | 'automatic' | 'discovery-tool' | 'recommendation';
    sourceContext?: string;
    triggers?: string[];
  };
}

export interface AdoptionSession {
  sessionId: string;
  personaId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  interactions: number;
  effectiveness?: {
    progressMade: 'none' | 'minimal' | 'good' | 'excellent';
    satisfactionLevel:
      | 'frustrated'
      | 'neutral'
      | 'satisfied'
      | 'very-satisfied';
    completedSuccessfully: boolean;
  };
}

export interface PersonaAdoptionStats {
  personaId: string;
  totalAdoptions: number;
  automaticAdoptions: number;
  manualAdoptions: number;
  discoveryToolAdoptions: number;
  averageSessionDuration: number;
  successRate: number;
  averageSatisfaction: number;
  mostCommonTriggers: string[];
  trending: 'up' | 'down' | 'stable';
}

export class AdoptionMetricsCollector extends EventEmitter {
  private adoptionEvents: AdoptionEvent[] = [];
  private activeSessions: Map<string, AdoptionSession> = new Map();
  private completedSessions: AdoptionSession[] = [];
  private enabled = true;

  constructor() {
    super();
  }

  /**
   * Record a persona adoption event
   */
  recordAdoption(event: Omit<AdoptionEvent, 'timestamp'>): void {
    if (!this.enabled) return;

    const fullEvent: AdoptionEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.adoptionEvents.push(fullEvent);
    this.emit('adoption', fullEvent);

    // Start a session if one doesn't exist
    if (event.sessionId && !this.activeSessions.has(event.sessionId)) {
      const session: AdoptionSession = {
        sessionId: event.sessionId,
        personaId: event.personaId,
        startTime: fullEvent.timestamp,
        interactions: 0,
      };
      this.activeSessions.set(event.sessionId, session);
    }
  }

  /**
   * Record an interaction within a persona session
   */
  recordInteraction(sessionId: string): void {
    if (!this.enabled) return;

    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.interactions++;
      this.emit('interaction', {
        sessionId,
        interactions: session.interactions,
      });
    }
  }

  /**
   * End a persona session with effectiveness metrics
   */
  endSession(
    sessionId: string,
    effectiveness?: AdoptionSession['effectiveness']
  ): void {
    if (!this.enabled) return;

    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.endTime = Date.now();
      session.duration = session.endTime - session.startTime;
      session.effectiveness = effectiveness;

      this.completedSessions.push(session);
      this.activeSessions.delete(sessionId);
      this.emit('sessionEnd', session);
    }
  }

  /**
   * Get adoption statistics for a specific persona
   */
  getPersonaStats(personaId: string): PersonaAdoptionStats {
    const adoptions = this.adoptionEvents.filter(
      e => e.personaId === personaId
    );
    const sessions = this.completedSessions.filter(
      s => s.personaId === personaId
    );

    const totalAdoptions = adoptions.length;
    const automaticAdoptions = adoptions.filter(
      e => e.context?.triggerType === 'automatic'
    ).length;
    const manualAdoptions = adoptions.filter(
      e => e.context?.triggerType === 'manual'
    ).length;
    const discoveryToolAdoptions = adoptions.filter(
      e => e.context?.triggerType === 'discovery-tool'
    ).length;

    const avgDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
          sessions.length
        : 0;

    const successfulSessions = sessions.filter(
      s => s.effectiveness?.completedSuccessfully
    ).length;
    const successRate =
      sessions.length > 0 ? successfulSessions / sessions.length : 0;

    const satisfactionScores = sessions
      .map(s => this.mapSatisfactionToScore(s.effectiveness?.satisfactionLevel))
      .filter(score => score !== null);
    const avgSatisfaction =
      satisfactionScores.length > 0
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) /
          satisfactionScores.length
        : 0;

    // Find most common triggers
    const allTriggers = adoptions
      .flatMap(e => e.context?.triggers || [])
      .filter(t => t);
    const triggerCounts = allTriggers.reduce(
      (counts, trigger) => {
        counts[trigger] = (counts[trigger] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );
    const mostCommonTriggers = Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trigger]) => trigger);

    // Calculate trending (simplified)
    const recentAdoptions = adoptions.filter(
      e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
    ).length;
    const previousAdoptions = adoptions.filter(
      e =>
        e.timestamp > Date.now() - 14 * 24 * 60 * 60 * 1000 &&
        e.timestamp <= Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    let trending: 'up' | 'down' | 'stable' = 'stable';
    if (recentAdoptions > previousAdoptions * 1.2) trending = 'up';
    else if (recentAdoptions < previousAdoptions * 0.8) trending = 'down';

    return {
      personaId,
      totalAdoptions,
      automaticAdoptions,
      manualAdoptions,
      discoveryToolAdoptions,
      averageSessionDuration: Math.round(avgDuration),
      successRate: Math.round(successRate * 100) / 100,
      averageSatisfaction: Math.round(avgSatisfaction * 100) / 100,
      mostCommonTriggers,
      trending,
    };
  }

  /**
   * Get overall system adoption metrics
   */
  getSystemStats(): {
    totalAdoptions: number;
    totalSessions: number;
    averageSessionDuration: number;
    overallSuccessRate: number;
    topPersonas: { personaId: string; adoptions: number }[];
    adoptionTrends: { date: string; adoptions: number }[];
  } {
    const totalAdoptions = this.adoptionEvents.length;
    const totalSessions = this.completedSessions.length;

    const avgDuration =
      totalSessions > 0
        ? this.completedSessions.reduce(
            (sum, s) => sum + (s.duration || 0),
            0
          ) / totalSessions
        : 0;

    const successfulSessions = this.completedSessions.filter(
      s => s.effectiveness?.completedSuccessfully
    ).length;
    const overallSuccessRate =
      totalSessions > 0 ? successfulSessions / totalSessions : 0;

    // Top personas by adoption
    const personaCounts = this.adoptionEvents.reduce(
      (counts, event) => {
        counts[event.personaId] = (counts[event.personaId] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );
    const topPersonas = Object.entries(personaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([personaId, adoptions]) => ({ personaId, adoptions }));

    // Adoption trends (last 30 days)
    const now = Date.now();
    const adoptionTrends: { date: string; adoptions: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = date.setHours(0, 0, 0, 0);
      const dayEnd = date.setHours(23, 59, 59, 999);

      const adoptions = this.adoptionEvents.filter(
        e => e.timestamp >= dayStart && e.timestamp <= dayEnd
      ).length;

      adoptionTrends.push({ date: dateStr, adoptions });
    }

    return {
      totalAdoptions,
      totalSessions,
      averageSessionDuration: Math.round(avgDuration),
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      topPersonas,
      adoptionTrends,
    };
  }

  /**
   * Get real-time adoption signals for the test persona
   */
  getTestPersonaSignals(): {
    recentAdoptions: AdoptionEvent[];
    activeSessions: AdoptionSession[];
    signalCount: number;
    lastSignalTime?: number;
  } {
    const testAdoptions = this.adoptionEvents.filter(
      e =>
        e.personaId === 'test-persona' &&
        e.timestamp > Date.now() - 60 * 60 * 1000 // Last hour
    );

    const testSessions = Array.from(this.activeSessions.values()).filter(
      s => s.personaId === 'test-persona'
    );

    return {
      recentAdoptions: testAdoptions,
      activeSessions: testSessions,
      signalCount: testAdoptions.length + testSessions.length,
      lastSignalTime:
        testAdoptions.length > 0
          ? Math.max(...testAdoptions.map(a => a.timestamp))
          : undefined,
    };
  }

  /**
   * Clear all metrics data
   */
  clearMetrics(): void {
    this.adoptionEvents.length = 0;
    this.activeSessions.clear();
    this.completedSessions.length = 0;
  }

  /**
   * Enable or disable metrics collection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private mapSatisfactionToScore(satisfaction?: string): number | null {
    if (!satisfaction) return null;
    const mapping: Record<string, number> = {
      frustrated: 0,
      neutral: 0.5,
      satisfied: 0.8,
      'very-satisfied': 1.0,
    };
    return mapping[satisfaction] ?? null;
  }
}

// Global adoption metrics collector instance
export const adoptionMetrics = new AdoptionMetricsCollector();
