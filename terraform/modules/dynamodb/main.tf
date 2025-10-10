resource "aws_dynamodb_table" "slides" {
  name         = "${var.app_name}-slides"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S" # String
  }

  attribute {
    name = "key"
    type = "S"
  }

  global_secondary_index {
    name            = "KeyIndex"
    hash_key        = "key"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}


resource "aws_dynamodb_table" "cheatsheets" {
  name         = "${var.app_name}-cheatsheets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S" # String
  }

  attribute {
    name = "key"
    type = "S"
  }


  global_secondary_index {
    name            = "KeyIndex"
    hash_key        = "key"
    projection_type = "ALL" # Project all attributes
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "shares" {
  name         = "${var.app_name}-shares"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "cheatsheetId" # Sort key for composite primary key

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "cheatsheetId"
    type = "S"
  }

  global_secondary_index {
    name            = "CheatsheetIdIndex"
    hash_key        = "cheatsheetId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_iam_policy" "dynamodb_policy" {
  name        = "${var.app_name}-dynamodb-policy"
  description = "Policy to allow access to DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.cheatsheets.arn,
          "${aws_dynamodb_table.cheatsheets.arn}/index/*",
          aws_dynamodb_table.shares.arn,
          "${aws_dynamodb_table.shares.arn}/index/*",
          aws_dynamodb_table.slides.arn,
          "${aws_dynamodb_table.slides.arn}/index/*"
        ]
      }
    ]
  })
}

