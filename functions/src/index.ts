import {HttpsOptions, onRequest} from 'firebase-functions/v2/https';
import {onSchedule, ScheduleOptions} from 'firebase-functions/v2/scheduler';
import logger from 'firebase-functions/logger';
import admin from 'firebase-admin';
import fetch from 'node-fetch';

export interface ExpTankStats {
  IDNum: number;
  expDef: number;
  expFrag: number;
  expSpot: number;
  expDamage: number;
  expWinRate: number;
}

admin.initializeApp();

const JSON_URL = 'https://www.blitzstars.com/api/tankaverages.json';

async function updateJsonData() {
  try {
    const response = await fetch(JSON_URL);
    const json = (await response.json()) as any[];

    const data: ExpTankStats[] = json.map((tank) => ({
      IDNum: tank.tank_id,
      expDamage: tank.special.damagePerBattle,
      expFrag: tank.special.killsPerBattle,
      expSpot: tank.special.spotsPerBattle,
      expDef: tank.all.dropped_capture_points / tank.all.battles,
      expWinRate: tank.special.winrate,
    }));

    await admin.firestore().collection('jsonData').doc('latest').set({data});

    logger.info('JSON data updated successfully!');
  } catch (error) {
    logger.error('Error updating JSON data:', error);
  }
}


export const manualUpdate = onRequest(
  {region: 'europe-west3'} as HttpsOptions,
  async (req, res) => {
    await updateJsonData();
    res.send('Manual update triggered!');
  }
);

export const scheduledUpdate = onSchedule(
  {region: 'europe-west3', schedule: 'every 24 hours'} as ScheduleOptions,
  async () => {
    await updateJsonData();
  }
);
