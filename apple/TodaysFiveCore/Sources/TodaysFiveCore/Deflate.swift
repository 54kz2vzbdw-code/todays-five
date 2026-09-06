// Deflate.swift — raw DEFLATE (RFC 1951: no zlib header, no Adler-32 tail), which is what the web's
// `new CompressionStream("deflate-raw")` writes and reads. Apple's COMPRESSION_ZLIB is the same
// algorithm under a misleading name — the framework's "zlib" is the bare deflate stream, not the
// zlib *container*. Checked, not assumed: test/fixtures/vectors.json carries envelopes crypto.js
// compressed, and the tests open them here and hand ours back for Node to open.
import Compression
import Foundation

public struct DeflateError: Error, CustomStringConvertible {
    public let message: String
    public var description: String { message }
}

public enum Deflate {
    public static func compress(_ data: Data) throws -> Data {
        try run(data, operation: COMPRESSION_STREAM_ENCODE)
    }

    public static func decompress(_ data: Data) throws -> Data {
        try run(data, operation: COMPRESSION_STREAM_DECODE)
    }

    private static func run(_ source: Data, operation: compression_stream_operation) throws -> Data {
        var stream = compression_stream(
            dst_ptr: UnsafeMutablePointer<UInt8>(bitPattern: -1)!, dst_size: 0,
            src_ptr: UnsafePointer<UInt8>(bitPattern: -1)!, src_size: 0, state: nil)
        guard compression_stream_init(&stream, operation, COMPRESSION_ZLIB) == COMPRESSION_STATUS_OK else {
            throw DeflateError(message: "compression_stream_init failed")
        }
        defer { compression_stream_destroy(&stream) }

        let capacity = 65_536
        let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: capacity)
        defer { buffer.deallocate() }

        var output = Data()
        var input = source
        if input.isEmpty { input = Data([0]) ; input.removeAll() }   // a defined, empty, addressable buffer

        let failed: Bool = input.withUnsafeBytes { (raw: UnsafeRawBufferPointer) -> Bool in
            stream.src_ptr = raw.bindMemory(to: UInt8.self).baseAddress ?? UnsafePointer<UInt8>(bitPattern: -1)!
            stream.src_size = source.count
            let flags = Int32(COMPRESSION_STREAM_FINALIZE.rawValue)
            while true {
                stream.dst_ptr = buffer
                stream.dst_size = capacity
                let status = compression_stream_process(&stream, flags)
                let produced = capacity - stream.dst_size
                if produced > 0 { output.append(buffer, count: produced) }
                if status == COMPRESSION_STATUS_END { return false }
                if status != COMPRESSION_STATUS_OK { return true }
                if produced == 0 && stream.src_size == 0 { return true }  // no progress: a truncated stream
            }
        }
        if failed {
            throw DeflateError(message: operation == COMPRESSION_STREAM_ENCODE ? "deflate failed" : "inflate failed")
        }
        return output
    }
}
