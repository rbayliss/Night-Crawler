import { CrawlerUnit } from '../types';

function unitInGroup(unit: CrawlerUnit, group: string): boolean {
  return !!unit.request.groups?.includes(group);
}

function filterOneByGroup(
  group: string,
  cb: OneHandler['cb']
): OneHandler['cb'] {
  return (unit): void => {
    if (unitInGroup(unit, group)) {
      cb(unit);
    }
  };
}
function filterManyByGroup(
  group: string,
  cb: ManyHandler['cb']
): ManyHandler['cb'] {
  return (units): void => {
    const matching = units.filter(unit => unitInGroup(unit, group));
    if (matching.length) {
      cb(matching);
    }
  };
}
interface OneHandler {
  description: string;
  cb: (unit: CrawlerUnit) => void;
}
interface ManyHandler {
  description: string;
  cb: (units: CrawlerUnit[]) => void;
}

export type PassingResult = { pass: true };
export type FailingResult = { pass: false; message: string };
export type TestResult = PassingResult | FailingResult;
export type TestResultMap<T extends TestResult = TestResult> = Map<string, T>;
export type EachResultMap = Map<string, TestResultMap>;

export default class TestContext {
  oneHandlers: OneHandler[];
  manyHandlers: ManyHandler[];

  constructor() {
    this.oneHandlers = [];
    this.manyHandlers = [];
  }

  each(description: OneHandler['description'], cb: OneHandler['cb']): this {
    this.oneHandlers.push({ description, cb });
    return this;
  }
  all(description: ManyHandler['description'], cb: ManyHandler['cb']): this {
    this.manyHandlers.push({ description, cb });
    return this;
  }
  eachInGroup(
    description: OneHandler['description'],
    group: string,
    cb: OneHandler['cb']
  ): this {
    return this.each(description, filterOneByGroup(group, cb));
  }
  allInGroup(
    description: ManyHandler['description'],
    group: string,
    cb: ManyHandler['cb']
  ): this {
    return this.all(description, filterManyByGroup(group, cb));
  }
  testUnit(unit: CrawlerUnit): TestResultMap {
    return this.oneHandlers.reduce((results, handler) => {
      try {
        handler.cb(unit);
        results.set(handler.description, { pass: true });
      } catch (e) {
        results.set(handler.description, {
          pass: false,
          message: e.toString()
        });
      }
      return results;
    }, new Map<string, TestResult>());
  }
  testUnits(units: CrawlerUnit[]): TestResultMap {
    return this.manyHandlers.reduce((results, handler) => {
      try {
        handler.cb(units);
        results.set(handler.description, { pass: true });
      } catch (e) {
        results.set(handler.description, {
          pass: false,
          message: e.toString()
        });
      }
      return results;
    }, new Map<string, TestResult>());
  }
}