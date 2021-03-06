// @flow

import type Analysis from '../../analysis';

export interface ComparisonFormatter {
  format(reports: Array<Analysis>): string;
}
