import * as express from 'express';

import ShiftService from '@services/shift';
import { ErrorResponse } from '@services/shift/shift';
import { writeJsonResponse } from '@utils/express';
import logger from '@utils/logger';
import User from '../models/user';
import Shift from '../models/shift';

export async function createShift(req: express.Request, res: express.Response): Promise<void> {
  try {
    const response = await ShiftService.createShift(req.body);
    if ((response as any).error) {
      if ((response as ErrorResponse).error.type === 'account_already_exists') {
        writeJsonResponse(res, 409, response);
      } else {
        throw new Error(`unsupported ${response}`);
      }
    } else {
      await User.findByIdAndUpdate(req.body.cleaner.id, { $push: { shifts: (response as any).shiftId } });
      await User.findByIdAndUpdate(req.body.client.id, { $push: { shifts: (response as any).shiftId } });
      writeJsonResponse(res, 201, response);
    }
  } catch (error) {
    logger.error(`createShift: ${error}`);
    writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
  }
}

export function getShifts(req: express.Request, res: express.Response): void {
  ShiftService.getAllShifts()
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 200, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`getShifts: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function getShift(req: express.Request, res: express.Response): void {
  ShiftService.getSingleShift({ _id: req.params.id })
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 200, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`getShift: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function updateShift(req: express.Request, res: express.Response): void {
  ShiftService.updateShift({ _id: req.params.id }, req.body)
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 200, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`createShift: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function deleteShift(req: express.Request, res: express.Response): void {
  ShiftService.deleteShift({ _id: req.params.id })
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 204, '');
      }
    })
    .catch((err: any) => {
      logger.error(`createShift: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export async function shiftSummary(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { from, to, client, cleaner } = req.body;
    const fromDate = new Date(from || Date.now());
    const toDate = new Date(to || Date.now());
    let group2;
    let match2;
    let summary2;

    const addFields = {
      range: `${fromDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })} - ${toDate.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })}`,
    };

    const project = {
      _id: 0,
    };

    const match = {
      'cleaner.id': cleaner,
      'client.id': client,
      date: { $gte: fromDate, $lte: toDate },
    };

    match2 = {
      ...match,
      paymentMethod: 'cash',
    };

    group2 = {
      _id: null,
      num: { $sum: 1 },
      amount: { $sum: `$amount` },
    };

    summary2 = await Shift.aggregate().match(match2).group(group2).addFields(addFields).project(project).exec();

    const group = {
      _id: null,
      num: { $sum: 1 },
      commission: { $sum: `$commission` },
    };

    const summary = await Shift.aggregate().match(match).group(group).addFields(addFields).project(project).exec();

    if (!summary || !summary.length) {
      return writeJsonResponse(res, 200, 'none_found');
    }

    if (summary2.length) {
      const outstanding = summary[0].commission - summary2[0].amount;
      summary[0].outstanding = outstanding;
      summary[0].amount = summary2[0].amount;

      return writeJsonResponse(res, 200, {
        summary: summary[0],
      });
    }

    return writeJsonResponse(res, 200, {
      summary: summary[0],
    });
  } catch (err) {
    logger.error(`shiftSummary: ${err}`);
    writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
  }
}
