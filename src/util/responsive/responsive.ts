/** 可插拔的responsive模块 */
import Nodes, { INode } from './nodes';
import * as _ from '@antv/util';
import { BBox, Shape } from '@antv/g';
import { constraintsLib } from '../responsive/constraints';
import { rulesLib } from '../responsive/rules';

interface IConstraint {
  name: string;
  expression: Function;
  strength?: 'required' | 'strong' | 'medium' | 'weak';
  weight?: Number;
}

interface IRule {
  name: string;
  method?: Function;
  options?: any;
}

interface ResponsiveCfg {
  region? : BBox;
  nodes: Nodes;
  constraints: any[];
  rules?: any[];
  iterationTime?: number;
}

export default class Responsive {
  region: BBox;
  nodes: Nodes;
  constraints: any[];
  rules: any[];
  iterationTime: number = 10;
  iterationIndex: number = 0;
  rulesLocker: any[] = [];
  currentConstraint: string;
  constraintIndex: number = 0;

  constructor(cfg: ResponsiveCfg) {
    _.assign(this, cfg);
    this.currentConstraint = this.constraints[0];
    if (this.rules) {
      this.iterationTime = this.rules[this.currentConstraint].length;
    }
    this.start();
    this._run();
    this.end();
  }

  public start() {
  }

  public iteration() {
    this.nodes.measureNodes();
    if (this.rules) this._applyRules();
    this.nodes.measureNodes();
  }

  public end() {
  }

  private _run() {
    let constraintPassed = this._constraintsTest();
    while (!constraintPassed) {
      if (this.iterationIndex > this.iterationTime - 1) {
        break;
      }
      this.iteration();
      constraintPassed = this._constraintsTest();
      this.iterationIndex++;
    }
    if (this.constraintIndex < this.constraints.length - 1) {
      this.constraintIndex ++;
      this.currentConstraint = this.constraints[this.currentConstraint];
      this.iterationTime = this.rules[this.currentConstraint].length;
      this.iterationIndex = 0;
      this._run();
    }
  }

  private _constraintsTest() {
    const constraint = constraintsLib[this.currentConstraint];
    const { type, expression } = constraint;
    const nodes = this.nodes.nodes;
    if (type === 'chain') return this._chainConstraint(expression, nodes);
    if (type === 'padding') return this._paddingConstraint(expression, this.region, nodes);

  }

  private _chainConstraint(expression, nodes) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      if (expression(a, b) === false) {
        return false;
      }
    }
    return true;
  }

  private _paddingConstraint(expression, region, nodes) {
    if (region) {

    }
    return true;
  }

  private _applyRules() {
    const ruleCfg = this.rules[this.currentConstraint][this.iterationIndex];
    if (this.rulesLocker.indexOf(ruleCfg) < 0) {
      const rule = rulesLib[ruleCfg.name];
      const options = ruleCfg.options ? ruleCfg.options :{};
      const nodes = this.nodes.nodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
              /** apply rule上下文 */
        this._applyRule(node.shape, rule, options, i, nodes);
      }
      this.rulesLocker.push(ruleCfg);
    }
  }

  private _applyRule(shape:Shape, rule, options, index, nodes) {
    rule(shape, options, index, nodes);
  }

}