FROM rust:1.89 as builder
WORKDIR /usr/src/app

COPY Cargo.toml Cargo.lock ./
# cargo build won’t work unless there’s a src/main.rs (or lib) file present
RUN mkdir src && echo "fn main() {println!(\"placeholder\");}" > src/main.rs
RUN cargo fetch

COPY . .
RUN cargo build --release -p openexam_user

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

# don't wanna run as root (too much permissions in case of a security breach)
RUN useradd --create-home --shell /bin/false appuser
WORKDIR /home/appuser
COPY --from=builder /usr/src/app/target/release/openexam_user /usr/local/bin/app

# if your app needs a config directory, create it and set permissions
RUN chown appuser:appuser /usr/local/bin/app

USER appuser
ENV RUST_LOG=info
EXPOSE 8000
CMD ["/usr/local/bin/app"]
