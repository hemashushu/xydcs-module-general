const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 计数器，带预设
 *
 * - 初始值为 0，第一次时钟上升沿时输出 1,第二次输出 2,如此类推。
 *   当所有输出位为 1 时，'Overflow' 端口输出高电平，然后下一次
 *   时钟上升沿之后输出 0。
 * - 当 'Set' 端口为高电平时，会使用 in 端口的值作为初始值进行复位。
 * - 当 'Reset' 端口为高电平时，计数器会复位为 0。
 * - 当 'Decrease' 端口为高电平时，计数器会进入倒数模式。
 * - 处于正数模式时，当所有输出位为 1 时 'Overflow' 端口输出高电平；
 *   处于倒数模式时，当输出值为 0 时 'Overflow' 端口输出高电平。
 * - 可以连接 'Overflow' 至 'Set' 端口以实现重复在预设值及最大值（或者
 *   数值 0，当倒数模式时）之间计数。
 *
 */
class CounterWithPreset extends SimpleLogicModule {

    // override
    init() {
        // 输入输出端口 out 的位宽
        this._bitWidth = this.getParameter('bitWidth');

        // 输入端口
        this._pinEnable = this.addPin('Enable', 1, PinDirection.input);
        this._pinSet = this.addPin('Set', 1, PinDirection.input);
        this._pinReset = this.addPin('Reset', 1, PinDirection.input);
        this._pinDecrease = this.addPin('Decrease', 1, PinDirection.input);
        this._pinClock = this.addPin('Clock', 1, PinDirection.input);
        this._pinIn = this.addPin('in', this._bitWidth, PinDirection.input);

        // 输出端口
        this._pinOut = this.addPin('out', this._bitWidth, PinDirection.output);
        this._pinOverflow = this.addPin('Overflow', 1, PinDirection.output);

        // 预设值
        this._presetValue = 0;

        // 当前的值
        this._value = 0;

        // 计数器的最大值
        this._maxValue = Math.pow(2, this._bitWidth) - 1;

        // 值等于 1 时为倒数模式
        this._decrease = 0;

        // 上一次时钟信号的值
        this._clockInt32Previous = 0;

        // 常量信号
        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);

        this._signalZero = Signal.createLow(this._bitWidth);
    }

    // override
    updateModuleState() {
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockInt32Previous === 0 && clockInt32 === 1;
        this._clockInt32Previous = clockInt32;

        if (isRisingEdge) {
            let resetInt32 = this._pinReset.getSignal().getLevel().toInt32();
            let setInt32 = this._pinSet.getSignal().getLevel().toInt32();
            let enableInt32 = this._pinEnable.getSignal().getLevel().toInt32();

            this._decrease = this._pinDecrease.getSignal().getLevel().toInt32();

            // reset 的优先级大于 set 的优先级
            if (resetInt32 === 1) {
                this._value = 0;

                this._pinOut.setSignal(this._signalZero);

                if (this._decrease === 1) {
                    // 在倒数模式下，out 的值为 0 时则设置 overflow 端口为高电平
                    this._pinOverflow.setSignal(this._signalHigh);
                } else {
                    this._pinOverflow.setSignal(this._signalLow);
                }

                // set 的优先级大于 enable 的优先级
            } else if (setInt32 === 1) {
                let inInt32 = this._pinIn.getSignal().getLevel().toInt32();
                this._value = inInt32;

                let signalOut = Signal.createWithoutHighZ(
                    this._bitWidth, Binary.fromInt32(this._value, this._bitWidth));

                this._pinOut.setSignal(signalOut);

                if ((this._decrease === 1 && this._value === 0) ||
                    (this._decrease === 0 && this._value === this._maxValue)) {
                    // 在正数模式下，out 的值为 max 时，或者
                    // 在倒数模式下，out 的值为 0 时，
                    // 设置 overflow 端口为高电平
                    this._pinOverflow.setSignal(this._signalHigh);
                } else {
                    this._pinOverflow.setSignal(this._signalLow);
                }

            } else if (enableInt32 === 1) {
                // 仅当 enable 为高电平时，才增加计数值及输出

                if (this._decrease === 1) {
                    // 倒数模式
                    this._value -= 1;

                    if (this._value < 0) {
                        this._value = this._maxValue;
                    }

                    let signalOut = Signal.createWithoutHighZ(
                        this._bitWidth, Binary.fromInt32(this._value, this._bitWidth));

                    // 在倒数模式下，out 的值为 0 时，
                    // 设置 overflow 端口为高电平
                    let signalOverflow = (this._value === 0) ?
                        this._signalHigh : this._signalLow;

                    this._pinOut.setSignal(signalOut);
                    this._pinOverflow.setSignal(signalOverflow);

                } else {
                    // 正数模式
                    this._value += 1;

                    if (this._value > this._maxValue) {
                        this._value = 0;
                    }

                    let signalOut = Signal.createWithoutHighZ(
                        this._bitWidth, Binary.fromInt32(this._value, this._bitWidth));

                    // 在正数模式下，out 的值为 max 时，
                    // 设置 overflow 端口为高电平
                    let signalOverflow = (this._value === this._maxValue) ?
                        this._signalHigh : this._signalLow;

                    this._pinOut.setSignal(signalOut);
                    this._pinOverflow.setSignal(signalOverflow);
                }
            }
        }
    }
}

module.exports = CounterWithPreset;