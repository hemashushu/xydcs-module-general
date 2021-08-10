const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * ROM，只读存储器
 *
 * - 当 chipSelect 为低电平时，输出高阻抗。
 * - 可以通过片选信号实现使用多个小容量的 ROM 构成一个大容量的 ROM。
 */
class ROM extends SimpleLogicModule {

    // override
    init() {
        // 数据位宽
        this._dataBitWidth = this.getParameter('dataBitWidth');

        // 地址的位宽
        this._addressBitWidth = this.getParameter('addressBitWidth');

        // 地址的位宽决定了最大能访问到哪个存储单元，
        // 比如 2 位地址最大能访问第 （2 ^ 2 = 4）- 1 个（从 0 开始数）存储单元，
        // 8 位地址最大能访问第 (2 ^ 8 = 256) - 1 个（从 0 开始数）存储单元
        this._dataUnitCount = this.getParameter('dataUnitCount');

        // 输入端口

        // 地址为存储单元的地址，不是以 byte 为单位的地址。
        // 例如存储单元为 32 位，则地址 0 将会读第一个存储单元的值（4 个字节），
        // 地址 1 将会读取第 2 个存储单元的值（同样 4 个字节）
        this._pinAddress = this.addPin('address', this._addressBitWidth, PinDirection.input);
        this._pinChipSelect = this.addPin('chipSelect', 1, PinDirection.input);

        // 输出端口
        this._pinDataOut = this.addPin('dataOut', this._dataBitWidth, PinDirection.output);

        // 存储单元数组
        this._storeUnits = new Array(this._dataUnitCount);
        for (let idx = 0; idx < this._dataUnitCount; idx++) {
            this._storeUnits[idx] = 0;
        }

        // 读取配置的初始化数据
        // 返回的是一个 Buffer 对象
        // https://nodejs.org/api/buffer.html
        let initialData = this.getParameter('initialData');
        if (initialData !== undefined && initialData !== null) {
            let wordSize = this._dataBitWidth / 8; // 计算一个字有多少个字节，即字长
            let initialDataBytes = initialData.length; //  https://nodejs.org/api/buffer.html#buffer_buf_length
            let initialDataLength = Math.ceil(initialDataBytes / wordSize); // 不足 1 个字的算 1 一个字
            let availableLength = Math.min(this._dataUnitCount, initialDataLength);

            for (let idx = 0; idx < availableLength; idx++) {
                // 由 bytes 数组按字长计算得字值。
                let wordValue = 0;
                for (let byteIdx = 0; byteIdx < wordSize; byteIdx++) {
                    let byteValue = initialData[idx * wordSize + byteIdx] ?? 0;
                    wordValue |= (byteValue << (byteIdx * 8));
                }
                this._storeUnits[idx] = wordValue;
            }
        }

        // 常量信号
        this._signalHighZ = Signal.createHighZ(this._dataBitWidth);
    }

    // override
    updateModuleState() {
        // chipSelect 为低电平时，输出高阻抗
        let chipSelectInt32 = this._pinChipSelect.getSignal().getLevel().toInt32();
        if (chipSelectInt32 === 1) {
            let addressInt32 = this._pinAddress.getSignal().getLevel().toInt32();
            let data = this._storeUnits[addressInt32];
            let signal = Signal.createWithoutHighZ(this._dataBitWidth, Binary.fromInt32(data, this._dataBitWidth));
            this._pinDataOut.setSignal(signal);
        } else {
            this._pinDataOut.setSignal(this._signalHighZ);
        }
    }
}

module.exports = ROM;