---
title: Getting Wezterm + Zellij to Open Files in VS Code
description: How to use WezTerm's hyperlink rules to open files in VS Code from Zellij
published: 2025-04-12T21:00:00+02:00
keywords: [wezterm, hyperlink_rules, vscode, zellij, dotfiles, productivity]
---

For the past year and a half, I've been using WezTerm[^1] and Zellij[^2] as my terminal and multiplexer of choice. Zellij has some hiccups here and there but the discoverability of shortcuts feels great, making it much easier to pick up than something like tmux in my opinion. Plus, both tools are written in Rust, which is always a bonus!

Over the years, my terminal setup has evolved a bit. I started with iTerm2[^3], which I liked for its features but found a bit slow when handling rapid screen updates (e.g., scrolling through large files in Nvim). I then switched to Alacritty[^4] for its speed but eventually moved on because it lacked support for ligatures. Now, WezTerm + Zellij feels like the perfect balance for my workflow.

## The Missing Link

Despite being happy with my current setup, there was one feature I missed from iTerm2: **the ability to open files in VS Code by simply clicking on their paths in the terminal.**

VS Code's integrated terminal does this seamlessly, and it's very handy when I want to quickly jump to a file mentioned in various contexts, such as:

- Failing test reports
- Linting warnings
- Compilation errors
- And more...

Selecting and copying file paths (or worse, typing them out manually) felt like a step backward in productivity. So I set out to get this functionality back in my WezTerm + Zellij setup.

WezTerm supports custom _hyperlink_rules_[^5], which allow you to define how file paths are handled. However, the default implementation assumes you're using WezTerm's built-in tabs and panes so it can determine the current working directory. Unfortunately, this doesn't work when using Zellij as the multiplexer.

I couldn't find a way to programmatically get the current working directory from a Zellij pane when clicking on a file path. So, I decided to take a more naive approach: **search for the file in my development folder using _fd_[^6].**

Here's the relevant part from my WezTerm config file:

```lua
-- Pull in the wezterm API
local wezterm = require "wezterm"

-- This table will hold the configuration.
local config = {}

local function find_absolute_file_path(relative_path)
    local search_dir = wezterm.home_dir .. "/Documents/Dev"

    local success, stdout, stderr = wezterm.run_child_process {"/opt/homebrew/bin/fd", "-p", relative_path, search_dir}

    if success then
        local first_line = stdout:match("[^\n]+")
        if first_line then
            return first_line
        end
    end

    return false
end

-- Update open uri function to open find:// links in vscode
wezterm.on(
    "open-uri",
    function(window, pane, uri)
        local start, match_end = uri:find("find://")

        if start == 1 then
            local file_path = uri:sub(match_end + 1)
            local line_number = ""
            local column_number = ""

            local position_start = string.find(file_path, ":")
            if position_start ~= nil then
                position = file_path:sub(position_start + 1)
                file_path = file_path:sub(1, position_start - 1)

                local position_end = string.find(position, ":")
                if position_end ~= nil then
                    column_number = position:sub(position_end + 1)
                    line_number = position:sub(1, position_end - 1)
                else
                    line_number = position
                end
            end

            local absolute_file_path = find_absolute_file_path(file_path)

            if absolute_file_path then
                local vscode_url = "vscode://file" .. absolute_file_path
                if line_number ~= "" and column_number ~= "" then
                    vscode_url = vscode_url .. ":" .. line_number .. ":" .. column_number
                elseif line_number ~= "" then
                    vscode_url = vscode_url .. ":" .. line_number
                end

                wezterm.open_with(vscode_url)
                return false
            end

            return true
        end

        return true
    end
)

-- Use the defaults as a base
config.hyperlink_rules = wezterm.default_hyperlink_rules()

table.insert(
    config.hyperlink_rules,
    {
        -- This regex can be tested at https://rustexp.lpil.uk/. Make sure to check `fancy-regex`
        regex = "[/.A-Za-z0-9_-]+\\.[A-Za-z0-9]+(:\\d+)?(:\\d+)?",
        format = "find://$0"
    }
)

-- and finally, return the configuration to wezterm
return config
```

## How It Works

1. I define a custom URI scheme find:// that gets triggered by my hyperlink rule
2. When a path is clicked, WezTerm captures it and passes it to my handler
3. The handler extracts line and column numbers if present
4. It then uses _fd_ to search for the file in my development directory
5. If found, it constructs a VS Code URL with the proper format and opens it.

The regex captures file paths that include extensions and optional line/column numbers (e.g., src/main.rs:10:5).

There's definitely room to improve this approach. The most obvious enhancement would be to narrow the search directory to the current project rather than searching my entire development folder. If anyone has insights on how to get the current working directory from a Zellij pane in WezTerm, I'd love to hear about it!

For those interested in my complete setup, check out my dotfiles: https://github.com/bezbac/dotfiles

[^1]: https://wezterm.org

[^2]: https://zellij.dev

[^3]: https://iterm2.com

[^4]: https://alacritty.org

[^5]: https://wezterm.org/config/lua/config/hyperlink_rules.html

[^6]: https://github.com/sharkdp/fd
