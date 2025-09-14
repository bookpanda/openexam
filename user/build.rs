fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true) // generate server code
        .build_client(true) // generate client code
        .out_dir("src/proto")
        .compile_protos(&["src/proto/auth.proto"], &["src/proto"])?;
    Ok(())
}
