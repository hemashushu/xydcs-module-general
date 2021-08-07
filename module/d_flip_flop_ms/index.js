const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * D 触发器，主-从脉冲型
 *
 * D = Data/Delay
 *
 * 在 clock low 时到下一个 clock low 输出存储的值存储值
 * 在 clock high 时存储值。
 * 即输出值 Q 总是比 D 的值慢一拍
 *
 * https://en.wikipedia.org/wiki/Flip-flop_(electronics)#Master%E2%80%93slave_edge-triggered_D_flip-flop
 *
 * 《实用电子元器件与电路基础 4th》P.584
 *
 * Clock       D   Qnext
 * Rising edge 0   0
 * Rising edge 1   1
 * Non-rising  X   Q
 */
class DFlipFlopMasterSlave extends SimpleLogicModule {

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
    }

    // override
    updateModuleState() {
        let dInt32 = this._pinD.getSignal().getLevel().toInt32();
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        if (clockInt32 === 0) {
            // 输出值
            let invertedDInt32 = ~ this._data;

            let signalQ = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(this._data, this._bitWidth));

            let signal_Q = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(invertedDInt32, this._bitWidth));

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);

        } else {
            // 更新存储值
            this._data = dInt32;
        }
    }
}

module.exports = DFlipFlopMasterSlave;