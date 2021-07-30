const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * D 触发器，上升边沿触发。
 *
 * D = Data/Delay
 *
 * Clock   D   Qnext
 * Rising edge 0   0
 * Rising edge 1   1
 * Non-rising  X   Q
 */
class DFlipFlop extends SimpleLogicModule {

    // override
    init() {
        // 输入端口
        this._pinD = this.addPin('D', 1, PinDirection.input);
        this._pinClock = this.addPin('Clock', 1, PinDirection.input);

        // 输出端口
        this._pinQ = this.addPin('Q', 1, PinDirection.output);
        this._pin_Q = this.addPin('_Q', 1, PinDirection.output);

        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);

        // 存储的值
        this._data = 0;
        this._clockPrevious = 0;
    }

    // override
    updateModuleState() {
        let dInt32 = this._pinD.getSignal().getLevel().toInt32();
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let signalQ;
        let signal_Q;

        let isRisingEdge = this._clockPrevious === 0 && clockInt32 === 1;
        this._clockPrevious = clockInt32;

        if (isRisingEdge) {
            // 更新存储值
            this._data = dInt32;

            // 输出值
            if (this._data === 0) {
                signalQ = this._signalLow;
                signal_Q = this._signalHigh;
            } else {
                signalQ = this._signalHigh;
                signal_Q = this._signalLow;
            }

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);
        }
    }
}

module.exports = DFlipFlop;