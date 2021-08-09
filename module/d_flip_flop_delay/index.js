const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * D 触发器，延迟输出（即主-从脉冲型）
 *
 * D = Delay
 *
 * 在时钟上升沿时更新储存值
 * 在时钟下降沿时更新输出值
 *
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
class DFlipFlopPrimaryMinor extends SimpleLogicModule {

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

        // 标记是否第一次更新状态
        //
        // 因为当前模块是时钟信号下降沿才更新输出端口（Q 和 ~Q）的信号，
        // 而时钟信号第一次输出的是 1，即可视为上升沿，导致模块第一次更新状态时
        // 错过了更新端口 ~Q 的值。
        // 使用这个标记来正确更新端口 ~Q 的值。
        this._firstTimeUpdateState = true;
    }

    // override
    updateModuleState() {
        if (this._firstTimeUpdateState) {
            this._firstTimeUpdateState = false;
            // 更新端口 ~Q 的值。
            let signal_Q = Signal.createHigh(this._bitWidth);
            this._pin_Q.setSignal(signal_Q);
        }

        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockInt32Previous === 0 && clockInt32 === 1; // rising edge = positive edge
        let isFallingEdge = this._clockInt32Previous === 1 && clockInt32 === 0; // falling edte = negative edge

        this._clockInt32Previous = clockInt32;

        if (isFallingEdge) {
            // 更新输出值
            let invertedDInt32 = ~ this._data;

            let signalQ = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(this._data, this._bitWidth));

            let signal_Q = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(invertedDInt32, this._bitWidth));

            this._pinQ.setSignal(signalQ);
            this._pin_Q.setSignal(signal_Q);

        } else if (isRisingEdge) {
            // 更新存储值
            let dInt32 = this._pinD.getSignal().getLevel().toInt32();
            this._data = dInt32;
        }
    }
}

module.exports = DFlipFlopPrimaryMinor;