const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 计数器，上升边沿触发。
 *
 * 默认值为 0，第一次时钟上升沿时输出 1,第二次输出 2,如此类推。
 * 当所有输出位为 1 时，'Overflow' 端口输出高电平，然后下一次
 * 时钟上升沿之后输出 0。
 *
 * 'Overflow' 端口可以用于串联多个计数器。
 */
class Counter extends SimpleLogicModule {

    // override
    init() {
        // 输出端口 out 的位宽
        this._bitWidth = this.getParameter('bitWidth');

        // 输入端口
        this._pinEnable = this.addPin('Enable', 1, PinDirection.input);
        this._pinReset = this.addPin('Reset', 1, PinDirection.input);
        this._pinClock = this.addPin('Clock', 1, PinDirection.input);

        // 输出端口
        this._pinOut = this.addPin('out', this._bitWidth, PinDirection.output);
        this._pinOverflow = this.addPin('Overflow', 1, PinDirection.output);

        // 初始值
        this._startValue = 0;

        // 当前的值
        this._value = 0;

        // 计数器的最大值
        this._maxValue = Math.pow(2, this._bitWidth) - 1;

        // 上一次时钟信号的值
        this._clockPrevious = 0;

        // 信号常量
        this._signalStart = Signal.createWithoutHighZ(
            this._bitWidth, Binary.fromInt32(0, this._bitWidth));

        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);
    }

    // override
    updateModuleState() {
        let enableInt32 = this._pinEnable.getSignal().getLevel().toInt32();
        let resetInt32 = this._pinReset.getSignal().getLevel().toInt32();
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockPrevious === 0 && clockInt32 === 1;
        this._clockPrevious = clockInt32;

        if (isRisingEdge) {
            // reset 的优先级大于 enable 的优先级
            if (resetInt32 === 1) {
                this._value = this._startValue;

                this._pinOut.setSignal(this._signalStart);
                this._pinOverflow.setSignal(this._signalLow);

            }else if (enableInt32 === 1){
                // 仅当 enable 为高电平时，才增加计数值及输出
                this._value += 1;

                if (this._value > this._maxValue) {
                    this._value = this._startValue;
                }

                let signalOut = Signal.createWithoutHighZ(
                    this._bitWidth, Binary.fromInt32(this._value, this._bitWidth));

                let signalOverflow = (this._value === this._maxValue) ?
                    this._signalHigh : this._signalLow;

                this._pinOut.setSignal(signalOut);
                this._pinOverflow.setSignal(signalOverflow);
            }
        }
    }
}

module.exports = Counter;