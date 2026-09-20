---
title: FASTA 批量处理脚本
slug: fasta-batch-utils
date: 2026-08-28
category: 脚本
version: v1.2.0
platform: 跨平台
file: /assets/uploads/fasta-batch-utils-v1.2.0.zip
summary: 一个不依赖第三方库的 Python 小工具，批量统计、筛选、重命名 FASTA，顺手导出成表格。
---

## 它解决什么问题

装 Biopython 本身经常就是最大的阻力——尤其在别人的机器上、或者临时借来的一台电脑上。
但「数一下这批序列有多少条、有多长、GC 多少」这种事，其实不需要动用那么重的工具。

这个脚本只用 Python 标准库，拷过去就能跑。

## 四个命令

| 命令 | 干什么 |
|------|--------|
| `summary` | 统计每个文件的条数、最短 / 平均 / 最长长度、总长、平均 GC |
| `filter` | 按长度区间或序列头关键字筛选，导出新的 FASTA |
| `rename` | 批量重命名序列头，支持前缀、补零编号、拼原文件名便于溯源 |
| `tsv` | 导出成制表符表格，直接进 Excel 或 pandas |

```bash
python3 fasta_batch_utils.py summary *.fasta
python3 fasta_batch_utils.py filter *.fasta --min-len 100 --max-len 2000 --out clean.fasta
python3 fasta_batch_utils.py rename *.fasta --prefix SAMPLE1_ --pad 3 --out renamed.fasta
python3 fasta_batch_utils.py tsv *.fasta --out records.tsv
```

## 几个刻意的取舍

**序列统一转大写。** 小写软屏蔽区（soft-masked）不单独区分——做统计的时候这个区别没意义，
真要区分的时候你也不会用这个脚本。

**筛选依据是纯文本匹配，不做正则。** 参数写起来更短，也不容易因为一个转义符写出个空结果文件。
需要正则的话，`cmd_filter` 里改一行就行。

**不做格式转换。** `.gb`、`.embl` 请先用别的工具转成 FASTA。一个脚本什么都干，最后什么都干不好。

## 边界

单文件是整体读进内存的。几万条序列没问题；上百万条建议按染色体拆开处理。

## 包里有什么

- `fasta_batch_utils.py` — 主脚本，约 300 行，注释写全了
- `README.md` — 完整用法，含输出示例和已知边界
- `examples/demo.fasta` — 三条示例序列，用来试命令

解压即用，不需要 `pip install` 任何东西。Python 3.9+ 即可。
