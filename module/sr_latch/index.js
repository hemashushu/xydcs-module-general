const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * SR 锁存器
 *
 * SR = Set/Reset
 *
 * 运算规则：
 * S   R   Qnext   动作
 * 0   0   Q   保持
 * 0   1   0   重置
 * 1   0   1   设置
 * 1   1   X   不允许的输入
 */
class RSLatch extends SimpleLogicModule {

    // override
    init() {
        // 输入端口
        this._pinS = this.addPin('S', 1, PinDirection.input);
        this._pinR = this.addPin('R', 1, PinDirection.input);

        // 输出端口
        this._pinQ = this.addPin('Q', 1, PinDirection.output);
        this._pin_Q = this.addPin('_Q', 1, PinDirection.output);

        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);

        // 存储的值
        this._data = 0;
    }

    // override
    updateModuleState() {
        let sInt32 = this._pinS.getSignal().getLevel().toInt32();
        let rInt32 = this._pinR.getSignal().getLevel().toInt32();

        let signalQ;
        let signal_Q;

        if (sInt32 === 0 && rInt32 === 0) {
            // 保持之前保存的值
            if (this._data === 0) {
                signalQ = this._signalLow;
                signal_Q = this._signalHigh;
            } else {
                signalQ = this._signalHigh;
                signal_Q = this._signalLow;
            }
        } else if (sInt32 === 1 && rInt32 === 1) {
            // 输入 S=1, R=1 是不允许的输入情况，因为 RS 触发器规定了 ~Q = NOT(Q)，
            // 如果使用两个 NOR 门实现 RS 触发器，则会输出 Q=0, ~Q=0，
            // 这跟 RS 触发器的规则相冲突。
            // https://en.wikipedia.org/wiki/Flip-flop_(electronics)#SR_NOR_latch
            //
            // 这里不处理这种情况（异常输入），留给上层模块检查/约束输入。
            signalQ = this._signalLow;
            signal_Q = this._signalLow;

        } else if (sInt32 === 1) {
            // 设置值
            this._data = 1;
            signalQ = this._signalHigh;
            signal_Q = this._signalLow;

        } else {
            // 重置值
            this._data = 0;
            signalQ = this._signalLow;
            signal_Q = this._signalHigh;
        }

        this._pinQ.setSignal(signalQ);
        this._pin_Q.setSignal(signal_Q);
    }
}

module.exports = RSLatch;