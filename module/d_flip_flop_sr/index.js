const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * D 触发器，带置位/复位功能，上升边沿触发。
 *
 * 一般带置位/复位功能的 D 触发器是异步设置的，即当 Set 或者 Reset
 * 为 1 时，会忽略 D 和 Clock 的状态，立即
 * 设置储存值及输出值。因为是立即输出，即不等待下一次时钟上升沿，
 * 所以叫 “异步” 设置。
 *
 * 当前的逻辑模块工作原理是基于每次输入信号发生改变后，统一一次计算/更新所有
 * 逻辑模块的状态至稳定状态为止，所以在下一次计算来临之前，端口的信号
 * 变化是被忽略的。即只有等待下一次时钟上升沿才输出，所以实际上是 “同步” 设置。
 *
 *
 * Inputs          Outputs
 * Set Reset   D   >   Q   Q
 * 0   1       X   X   0   1
 * 1   0       X   X   1   0
 * 1   1       X   X   1   1
 */
class DFlipFlopAsync extends SimpleLogicModule {

    // override
    init() {
        // 输入端口
        this._pinD = this.addPin('D', 1, PinDirection.input);
        this._pinClock = this.addPin('Clock', 1, PinDirection.input);
        this._pinSet = this.addPin('Set', 1, PinDirection.input);
        this._pinReset = this.addPin('Reset', 1, PinDirection.input);

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
        let setInt32 = this._pinSet.getSignal().getLevel().toInt32();
        let resetInt32 = this._pinReset.getSignal().getLevel().toInt32();

        let signalQ;
        let signal_Q;

        let isRisingEdge = this._clockPrevious === 0 && clockInt32 === 1;
        this._clockPrevious = clockInt32;

        if (setInt32 === 1 && resetInt32 === 1) {
            this._data = 1;
            signalQ = this._signalHigh;
            signal_Q = this._signalHigh;

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);

        } else if (setInt32 === 1) {
            this._data = 1;
            signalQ = this._signalHigh;
            signal_Q = this._signalLow;

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);

        } else if (resetInt32 === 1) {
            this._data = 0;
            signalQ = this._signalLow;
            signal_Q = this._signalHigh;

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);

        } else {
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
}

module.exports = DFlipFlopAsync;