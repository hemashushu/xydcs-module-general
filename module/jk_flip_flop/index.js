const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * JK 触发器，上升边沿触发。
 *
 * J = Set, K = Reset
 *
 * J    K    Comment         Qnext
 * 0    0    Hold state      Q
 * 0    1    Reset           0
 * 1    0    Set             1
 * 1    1    Toggle          ~Q
 */
class JKFlipFlop extends SimpleLogicModule {

    // override
    init() {
        // 输入端口
        this._pinJ = this.addPin('J', 1, PinDirection.input);
        this._pinK = this.addPin('K', 1, PinDirection.input);
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
        let jInt32 = this._pinJ.getSignal().getLevel().toInt32();
        let kInt32 = this._pinK.getSignal().getLevel().toInt32();
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let signalQ;
        let signal_Q;

        let isRisingEdge = this._clockPrevious === 0 && clockInt32 === 1;
        this._clockPrevious = clockInt32;

        if (isRisingEdge) {
            if (jInt32 === 0 && kInt32 === 0) {
                // 保持之前保存的值
            } else if (jInt32 === 1 && kInt32 === 1) {
                // 翻转值
                this._data = (this._data === 0) ? 1 : 0;
            } else if (jInt32 === 1) {
                // 设置值
                this._data = 1;
            } else {
                // 重置值
                this._data = 0;
            }

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

module.exports = JKFlipFlop;