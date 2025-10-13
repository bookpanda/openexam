package repository

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"storage/internal/config"
	"storage/internal/domain"
)

type DynamoDBRepository struct {
	client      *dynamodb.Client
	filesTable  string
	sharesTable string
}

func NewDynamoDBRepository(client *dynamodb.Client, config *config.DynamoDBConfig) *DynamoDBRepository {
	return &DynamoDBRepository{
		client:      client,
		filesTable:  config.FilesTable,
		sharesTable: config.SharesTable,
	}
}

func (r *DynamoDBRepository) GetAllFiles(ctx context.Context, userId string) ([]domain.File, error) {
	// Step 1: Query shares table to get all fileIds user has access to
	sharesOut, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &r.sharesTable,
		KeyConditionExpression: aws.String("userId = :uid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":uid": &types.AttributeValueMemberS{Value: userId},
		},
	})
	if err != nil {
		return nil, err
	}

	if len(sharesOut.Items) == 0 {
		return []domain.File{}, nil // Return empty array if no shares found
	}

	// Step 2: Extract fileIds from shares and build keys for batch get
	var keysToFetch []map[string]types.AttributeValue
	for _, item := range sharesOut.Items {
		var share domain.Share
		if err := attributevalue.UnmarshalMap(item, &share); err != nil {
			continue // Skip invalid items
		}

		keysToFetch = append(keysToFetch, map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: share.FileID},
		})
	}

	if len(keysToFetch) == 0 {
		return []domain.File{}, nil
	}

	// Step 3: Batch get all files in a single request (up to 100 items)
	batchOut, err := r.client.BatchGetItem(ctx, &dynamodb.BatchGetItemInput{
		RequestItems: map[string]types.KeysAndAttributes{
			r.filesTable: {
				Keys: keysToFetch,
			},
		},
	})
	if err != nil {
		return nil, err
	}

	// Step 4: Unmarshal all files
	var files []domain.File
	for _, item := range batchOut.Responses[r.filesTable] {
		var file domain.File
		if err := attributevalue.UnmarshalMap(item, &file); err != nil {
			continue // Skip if unmarshal fails
		}
		files = append(files, file)
	}

	return files, nil
}

func (r *DynamoDBRepository) GetFile(ctx context.Context, id string) (domain.File, error) {
	out, err := r.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &r.filesTable,
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
	})
	if err != nil {
		return domain.File{}, err
	}
	if len(out.Item) == 0 {
		return domain.File{}, domain.ErrNotFound
	}

	var file domain.File
	if err := attributevalue.UnmarshalMap(out.Item, &file); err != nil {
		return domain.File{}, err
	}
	return file, nil
}

func (r *DynamoDBRepository) GetSharesOfFile(ctx context.Context, fileId, key string) ([]domain.Share, error) {
	// Query GSI by fileId to get all shares for this file
	out, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &r.sharesTable,
		IndexName:              aws.String("FileIdIndex"),
		KeyConditionExpression: aws.String("fileId = :fid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":fid": &types.AttributeValueMemberS{Value: fileId},
		},
	})
	if err != nil {
		return []domain.Share{}, err
	}
	if len(out.Items) == 0 {
		return []domain.Share{}, nil // Return empty array if no shares found
	}

	var shares []domain.Share
	for _, item := range out.Items {
		var share domain.Share
		if err := attributevalue.UnmarshalMap(item, &share); err != nil {
			continue // Skip invalid items
		}
		shares = append(shares, share)
	}
	return shares, nil
}

func (r *DynamoDBRepository) ShareFile(ctx context.Context, userId, key, fileId string) error {
	_, err := r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &r.sharesTable,
		Item: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userId},
			"key":    &types.AttributeValueMemberS{Value: key},
			"fileId": &types.AttributeValueMemberS{Value: fileId},
		},
	})
	return err
}

func (r *DynamoDBRepository) UnshareFile(ctx context.Context, userId, key string) error {
	_, err := r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: &r.sharesTable,
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userId},
			"key":    &types.AttributeValueMemberS{Value: key},
		},
	})
	return err
}

func (r *DynamoDBRepository) FindFileByKey(ctx context.Context, key string) (domain.File, error) {
	out, err := r.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &r.filesTable,
		IndexName:              aws.String("KeyIndex"),
		KeyConditionExpression: aws.String("#k = :v"),
		ExpressionAttributeNames: map[string]string{
			"#k": "key",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":v": &types.AttributeValueMemberS{Value: key},
		},
	})
	if err != nil {
		return domain.File{}, err
	}
	if len(out.Items) == 0 {
		return domain.File{}, domain.ErrNotFound
	}

	var c domain.File
	if err := attributevalue.UnmarshalMap(out.Items[0], &c); err != nil {
		return domain.File{}, err
	}
	return c, nil
}
