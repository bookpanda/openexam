# gateway
```bash
cargo watch -x run

cargo build
```

## using a lighter linker when compiling (not working)
```bash
brew install mold

RUSTFLAGS="-C link-arg=-fuse-ld=mold" cargo build

mkdir -p ~/.cargo
nano ~/.cargo/config.toml
# write this ####
[build]
rustflags = ["-C", "link-arg=-fuse-ld=mold"]
#################

# check
cargo build -v
```