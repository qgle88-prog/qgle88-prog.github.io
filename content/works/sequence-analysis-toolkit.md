---
title: 序列分析工具集
slug: sequence-analysis-toolkit
date: 2026-08-20
status: 使用中
stack: [Python, Biopython, pandas]
icon: bio
summary: 从 FASTA 到结构化表格：批量解析、区域提取、位点比对，输出可以直接进报告的图和表。
---

## 解决的问题

手工处理序列文件既慢又容易出错，尤其是需要把多个文件放在一起比对的时候。

## 现在能做什么

- 批量解析 FASTA，统一成表格，字段可控
- 按设定区域提取子序列
- 多个样本之间做位点比对，差异高亮
- 直接输出成图和表，能贴进报告

## 技术选择

用 Biopython 做解析，pandas 做整理，matplotlib 和 seaborn 出图。
选它们的原因很简单：生态成熟，遇到问题能搜到答案。
