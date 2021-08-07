const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * D 触发器，上升边沿触发。
 *
 * D = Data/Delay
 *
 * Clock       D   Qnext
 * Rising edge 0   0
 * Rising edge 1   1
 * Non-rising  X   Q
 */
class DFlipFlop extends SimpleLogicModule {

    // override
    init() {
        // 数据位宽
        this._bitWidth = this.getParameter('bitWidth');

        // 输入端口
        this._pinD = this.addPin('D', this._bitWidth, PinDirection.input);
        this._pinClock = this.addPin('Clock', 1, PinDirection.input);

        // 输出端口
        this._pinQ = this.addPin('Q', this._bitWidth, PinDirection.output);
        this._pin_Q = this.addPin('_Q', this._bitWidth, PinDirection.output);

        // 存储的值
        this._data = 0;
        this._clockInt32Previous = 0;
    }

    // override
    updateModuleState() {
        let dInt32 = this._pinD.getSignal().getLevel().toInt32();
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockInt32Previous === 0 && clockInt32 === 1;
        this._clockInt32Previous = clockInt32;

        if (isRisingEdge) {
            // 更新存储值
            this._data = dInt32;
            let invertedDInt32 = ~dInt32;

            let signalQ = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(dInt32, this._bitWidth));

            let signal_Q = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(invertedDInt32, this._bitWidth));

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);
        }
    }
}

module.exports = DFlipFlop;