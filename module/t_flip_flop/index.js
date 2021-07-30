const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * T 触发器，上升边沿触发。
 *
 * T = Toggle
 *
 * T   Q   Qnext Comment
 * 0   0   0     Hold state (no clock)
 * 0   1   1     Hold state (no clock)
 * 1   0   1     Toggle
 * 1   1   0     Toggle
 */
class TFlipFlop extends SimpleLogicModule {

    // override
    init() {
        // 输入端口
        this._pinT = this.addPin('T', 1, PinDirection.input);
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
        let tInt32 = this._pinT.getSignal().getLevel().toInt32();
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let signalQ;
        let signal_Q;

        let isRisingEdge = this._clockPrevious === 0 && clockInt32 === 1;
        this._clockPrevious = clockInt32;

        if (tInt32 === 0) {
            // 保持值不变
            if (this._data === 0) {
                signalQ = this._signalLow;
                signal_Q = this._signalHigh;
            } else {
                signalQ = this._signalHigh;
                signal_Q = this._signalLow;
            }

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);

        } else {
            if (isRisingEdge) {
                // 更新存储值
                this._data = this._data ^ tInt32; // XOR

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
}

module.exports = TFlipFlop;