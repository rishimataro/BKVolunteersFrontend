<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **BKVolunteersFrontend** (53612 symbols, 65120 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource                                              | Use for                                  |
| ----------------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/BKVolunteersFrontend/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/BKVolunteersFrontend/clusters`       | All functional areas                     |
| `gitnexus://repo/BKVolunteersFrontend/processes`      | All execution flows                      |
| `gitnexus://repo/BKVolunteersFrontend/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->

# Vietnamese UI Copy Lock

Tất cả nội dung hiển thị cho người dùng cuối phải là tiếng Việt có dấu, đúng chính tả và tự nhiên.

Bắt buộc:

- Mọi label, button, menu, tiêu đề, placeholder, validation message, toast, empty state, modal, tooltip phải dùng tiếng Việt có dấu.
- Không được viết tiếng Việt không dấu như: "Dang nhap", "Quan ly", "Cap nhat", "Thong tin".
- Không được tự ý chuyển nội dung tiếng Việt có dấu thành ASCII.
- Chỉ được bỏ dấu trong slug, route path, enum, key, className, biến code, mã định danh kỹ thuật.
- Không đổi tên API field, database column, env key, route hoặc permission key sang tiếng Việt có dấu.
- Nếu gặp text không dấu, phải sửa sang tiếng Việt có dấu trước khi hoàn thành task.
- Trước khi báo hoàn tất, phải tự kiểm tra lại toàn bộ UI copy đã sửa.

Ví dụ sửa đúng:

- "Dang nhap" -> "Đăng nhập"
- "Quan ly nguoi dung" -> "Quản lý người dùng"
- "Cap nhat thanh cong" -> "Cập nhật thành công"
- "Khong co du lieu" -> "Không có dữ liệu"
- "Vui long nhap email" -> "Vui lòng nhập email"
