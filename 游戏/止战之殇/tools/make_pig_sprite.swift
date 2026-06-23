import AppKit
import CoreGraphics
import Foundation

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let cropX = 84
let cropY = 82
let cropW = 790
let cropH = 1100

guard
  let image = NSImage(contentsOfFile: inputPath),
  let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil),
  let cropped = cgImage.cropping(to: CGRect(x: cropX, y: cropY, width: cropW, height: cropH))
else {
  fatalError("Unable to read or crop source image.")
}

let bytesPerPixel = 4
let bytesPerRow = cropW * bytesPerPixel
var pixels = [UInt8](repeating: 0, count: cropH * bytesPerRow)
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)

guard let context = CGContext(
  data: &pixels,
  width: cropW,
  height: cropH,
  bitsPerComponent: 8,
  bytesPerRow: bytesPerRow,
  space: colorSpace,
  bitmapInfo: bitmapInfo.rawValue
) else {
  fatalError("Unable to create bitmap context.")
}

context.interpolationQuality = .none
context.draw(cropped, in: CGRect(x: 0, y: 0, width: cropW, height: cropH))

func offset(_ index: Int) -> Int {
  index * bytesPerPixel
}

let bgSamples = [0, cropW - 1]
let bg = bgSamples.reduce((r: 0.0, g: 0.0, b: 0.0)) { acc, index in
  let i = offset(index)
  return (
    acc.r + Double(pixels[i]),
    acc.g + Double(pixels[i + 1]),
    acc.b + Double(pixels[i + 2])
  )
}
let bgColor = (
  r: bg.r / Double(bgSamples.count),
  g: bg.g / Double(bgSamples.count),
  b: bg.b / Double(bgSamples.count)
)

func isBackgroundLike(_ index: Int) -> Bool {
  let i = offset(index)
  let dr = Double(pixels[i]) - bgColor.r
  let dg = Double(pixels[i + 1]) - bgColor.g
  let db = Double(pixels[i + 2]) - bgColor.b
  return sqrt(dr * dr + dg * dg + db * db) < 74
}

var visited = [Bool](repeating: false, count: cropW * cropH)
var stack: [Int] = []
for x in 0..<cropW {
  stack.append(x)
  stack.append((cropH - 1) * cropW + x)
}
for y in 1..<(cropH - 1) {
  stack.append(y * cropW)
  stack.append(y * cropW + cropW - 1)
}

while let index = stack.popLast() {
  if visited[index] { continue }
  visited[index] = true
  if !isBackgroundLike(index) { continue }

  let i = offset(index)
  pixels[i + 3] = 0

  let x = index % cropW
  let y = index / cropW
  if x > 0 { stack.append(index - 1) }
  if x < cropW - 1 { stack.append(index + 1) }
  if y > 0 { stack.append(index - cropW) }
  if y < cropH - 1 { stack.append(index + cropW) }
}

let data = Data(pixels)
guard
  let provider = CGDataProvider(data: data as CFData),
  let outputImage = CGImage(
    width: cropW,
    height: cropH,
    bitsPerComponent: 8,
    bitsPerPixel: 32,
    bytesPerRow: bytesPerRow,
    space: colorSpace,
    bitmapInfo: bitmapInfo,
    provider: provider,
    decode: nil,
    shouldInterpolate: false,
    intent: .defaultIntent
  )
else {
  fatalError("Unable to create output image.")
}

let rep = NSBitmapImageRep(cgImage: outputImage)
guard let png = rep.representation(using: .png, properties: [:]) else {
  fatalError("Unable to encode PNG.")
}
try png.write(to: URL(fileURLWithPath: outputPath))
