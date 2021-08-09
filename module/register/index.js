const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 寄存器，上升边沿触发。
 * 当 enable 为高电平时，输出的信号等于输入的信号，即输出的总是最新的值
 */
class Register extends SimpleLogicModule {

    // override
    init() {
        // 数据位宽
        this._bitWidth = this.getParameter('bitWidth');

        // 输入端口
        this._pinD = this.addPin('D', this._bitWidth, PinDirection.input);
        this._pinClock = this.addPin('Clock', 1, PinDirection.input);
        this._pinEnable = this.addPin('Enable', 1, PinDirection.input);

        // 输出端口
        this._pinQ = this.addPin('Q', this._bitWidth, PinDirection.output);

        // 存储的值
        this._data = 0;
        this._clockInt32Previous = 0;
    }

    // override
    updateModuleState() {
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockInt32Previous === 0 && clockInt32 === 1;
        this._clockInt32Previous = clockInt32;

        if (isRisingEdge) {
            let enableInt32 = this._pinEnable.getSignal().getLevel().toInt32();
            if (enableInt32 === 1) {
                let dInt32 = this._pinD.getSignal().getLevel().toInt32();

                // 更新存储值
                this._data = dInt32;

                let signalQ = Signal.createWithoutHighZ(this._bitWidth,
                    Binary.fromInt32(dInt32, this._bitWidth));

                this._pinQ.setSignal(signalQ);
            }
        }
    }
}

module.exports = Register;