const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 移位寄存器（串入，并出），上升边沿触发。
 *
 * 参考《实用电子元器件与电路基础 4th》P.605
 */
class Counter extends SimpleLogicModule {

    // override
    init() {
        // 输出端口 out 的数量
        this._outputPinCount = this.getParameter('outputPinCount');

        // 输入端口
        this._pinEnable = this.addPin('Enable', 1, PinDirection.input);
        this._pinReset = this.addPin('Reset', 1, PinDirection.input);
        this._pinClock = this.addPin('Clock', 1, PinDirection.input);
        this._pinIn = this.addPin('in', 1, PinDirection.input);

        // 输出端口的名称分别为 out_0, out_1, ... out_N
        // MSB: out_3, LSB: out_0
        for (let idx = 0; idx < this._outputPinCount; idx++) {
            this.addPin('out_' + idx, 1, PinDirection.output);
        }

        // 当前的值
        this._value = 0;

        // 上一次时钟信号的值
        this._clockInt32Previous = 0;

        // 常量信号
        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);
    }

    // override
    updateModuleState() {
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockInt32Previous === 0 && clockInt32 === 1;
        this._clockInt32Previous = clockInt32;

        if (isRisingEdge) {
            let resetInt32 = this._pinReset.getSignal().getLevel().toInt32();
            let enableInt32 = this._pinEnable.getSignal().getLevel().toInt32();

            // reset 的优先级大于 enable 的优先级
            if (resetInt32 === 1) {
                this._value = 0;
                this.writeOutputPinSignals();

            }else if (enableInt32 === 1){
                // 仅当 enable 为高电平时，才移位及计数

                let signalIn = this._pinIn.getSignal();
                let inLevelInt32 = signalIn.getLevel().toInt32();
                let inHighZInt32 = signalIn.getHighZ().toInt32();
                let inInt32 = inLevelInt32 & (~ inHighZInt32); // 0 or 1

                // 左移一位，然后将最低位（LSB）设置为 in 的有效信号值。
                this._value = this._value << 1;
                this._value = this._value | inInt32;

                this.writeOutputPinSignals();
            }
        }
    }

    writeOutputPinSignals() {
        for (let idx = 0; idx < this._outputPinCount; idx++) {
            if ((this._value & Math.pow(2, idx)) > 0){
                this.outputPins[idx].setSignal(this._signalHigh);
            }else {
                this.outputPins[idx].setSignal(this._signalLow);
            }
        }
    }
}

module.exports = Counter;